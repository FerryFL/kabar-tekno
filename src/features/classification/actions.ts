"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb, hasDatabase } from "@/db";
import { mlEvaluationRuns, mlModels, news, newsLabels, newsPredictions } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/current-user";

import { classificationLabels, MlServiceError, predict, trainAndTest, type ClassificationLabel } from "./ml-client";
import { getClassificationDataset } from "./queries";

const labelSchema = z.enum(classificationLabels);
const uuidSchema = z.string().uuid();

const value = (data: FormData, key: string) => String(data.get(key) ?? "");

async function assertAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }
}

function revalidateClassification() {
  revalidatePath("/admin/classification");
  revalidatePath("/");
}

export async function labelNewsAction(data: FormData) {
  await assertAdmin();
  if (!hasDatabase) throw new Error("Database is not configured.");

  const newsId = uuidSchema.parse(value(data, "newsId"));
  const label = labelSchema.parse(value(data, "label"));
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await getDb().insert(newsLabels).values({ newsId, label, labelSource: "manual", labeledBy: user.id }).onConflictDoUpdate({
    target: newsLabels.newsId,
    set: { label, labelSource: "manual", labeledBy: user.id, updatedAt: new Date() },
  });
  revalidateClassification();
}

export async function labelNewsBulkAction(data: FormData) {
  await assertAdmin();
  if (!hasDatabase) throw new Error("Database is not configured.");

  const ids = data.getAll("newsIds").map(String).map((id) => uuidSchema.parse(id));
  const label = labelSchema.parse(value(data, "label"));
  if (!ids.length) throw new Error("Pilih minimal satu berita.");

  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await getDb().transaction(async (tx) => {
    for (const newsId of ids) {
      await tx.insert(newsLabels).values({ newsId, label, labelSource: "manual", labeledBy: user.id }).onConflictDoUpdate({
        target: newsLabels.newsId,
        set: { label, labelSource: "manual", labeledBy: user.id, updatedAt: new Date() },
      });
    }
  });
  revalidateClassification();
}

export async function trainAndTestModelAction() {
  await assertAdmin();
  if (!hasDatabase) throw new Error("Database is not configured.");

  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const dataset = await getClassificationDataset();
  if (!dataset.length) throw new Error("Dataset berlabel masih kosong.");

  const version = `${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 12)}-${crypto.randomUUID().slice(0, 8)}`;
  const db = getDb();
  const [model] = await db.insert(mlModels).values({
    version,
    status: "training",
    createdBy: user.id,
    classDistribution: Object.fromEntries(classificationLabels.map((label) => [label, dataset.filter((row) => row.label === label).length])),
  }).returning();
  const startedAt = new Date();

  try {
    const result = await trainAndTest({
      model_version: version,
      random_seed: 42,
      test_size: 0.2,
      cv_folds: 5,
      rows: dataset.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description ?? "",
        label: row.label as ClassificationLabel,
      })),
    });

    await db.transaction(async (tx) => {
      await tx.update(mlModels).set({
        status: "ready",
        artifactName: result.artifact_name,
        trainingSampleCount: result.training_sample_count,
        testSampleCount: result.test_sample_count,
        metrics: result.metrics,
        updatedAt: new Date(),
      }).where(eq(mlModels.id, model.id));

      await tx.insert(mlEvaluationRuns).values({
        id: crypto.randomUUID(),
        modelId: model.id,
        status: "completed",
        randomSeed: 42,
        testSize: "0.2",
        crossValidationFolds: 5,
        accuracy: String(result.metrics.accuracy),
        macroPrecision: String(result.metrics.macro_precision),
        macroRecall: String(result.metrics.macro_recall),
        macroF1: String(result.metrics.macro_f1),
        weightedF1: String(result.metrics.weighted_f1),
        confusionMatrix: result.metrics.confusion_matrix,
        startedAt,
        finishedAt: new Date(),
      });
    });
  } catch (error) {
    console.error("Classification training failed", { modelId: model.id, version, error });
    const safeMessage = error instanceof MlServiceError ? error.message : "Training gagal.";

    await db.update(mlModels).set({ status: "failed", metrics: { error: safeMessage }, updatedAt: new Date() }).where(eq(mlModels.id, model.id));
    throw new Error(safeMessage);
  }

  revalidateClassification();
}

export async function predictNewsAction(data: FormData) {
  await assertAdmin();
  if (!hasDatabase) throw new Error("Database is not configured.");

  const modelId = uuidSchema.parse(value(data, "modelId"));
  const ids = data.getAll("newsIds").map(String).map((id) => uuidSchema.parse(id));
  if (!ids.length) throw new Error("Pilih minimal satu berita.");

  const db = getDb();
  const [model] = await db.select().from(mlModels).where(and(
    eq(mlModels.id, modelId),
    eq(mlModels.status, "ready"),
    eq(mlModels.isActive, true),
  )).limit(1);
  if (!model) throw new Error("Model belum aktif.");

  const rows = await db.select({ id: news.id, title: news.title, description: news.description }).from(news).where(inArray(news.id, ids));

  try {
    const result = await predict({
      model_version: model.version,
      rows: rows.map((row) => ({ ...row, description: row.description ?? "" })),
    });

    await db.transaction(async (tx) => {
      await tx.insert(newsPredictions).values(result.predictions.map((prediction) => ({
        newsId: prediction.id,
        modelId,
        label: prediction.label,
        confidence: String(prediction.confidence),
        scores: prediction.scores ?? null,
      })));
    });
  } catch (error) {
    console.error("Classification prediction failed", { modelId, newsIds: ids, error });
    throw new Error(error instanceof MlServiceError ? error.message : "Prediction gagal.");
  }

  revalidateClassification();
}

export async function activateModelAction(data: FormData) {
  await assertAdmin();
  if (!hasDatabase) throw new Error("Database is not configured.");

  const modelId = uuidSchema.parse(value(data, "modelId"));
  try {
    await getDb().transaction(async (tx) => {
      await tx.update(mlModels).set({ isActive: false, status: "ready", updatedAt: new Date() }).where(eq(mlModels.isActive, true));

      const updated = await tx.update(mlModels).set({ isActive: true, status: "ready", updatedAt: new Date() }).where(and(
        eq(mlModels.id, modelId),
        eq(mlModels.status, "ready"),
      )).returning({ id: mlModels.id });
      if (!updated.length) throw new Error("Model belum ready atau tidak ditemukan.");
    });
  } catch (error) {
    console.error("Classification model activation failed", { modelId, error });
    throw error;
  }
  revalidateClassification();
}

export async function approvePredictionAction(data: FormData) {
  await assertAdmin();
  if (!hasDatabase) throw new Error("Database is not configured.");

  const predictionId = uuidSchema.parse(value(data, "predictionId"));
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const db = getDb();
  const [prediction] = await db
    .select()
    .from(newsPredictions)
    .where(eq(newsPredictions.id, predictionId))
    .limit(1);
  if (!prediction) throw new Error("Prediction tidak ditemukan.");

  const [existingLabel] = await db
    .select({ source: newsLabels.labelSource })
    .from(newsLabels)
    .where(eq(newsLabels.newsId, prediction.newsId))
    .limit(1);
  if (existingLabel?.source === "manual") {
    throw new Error("Label manual tidak boleh ditimpa oleh prediction AI.");
  }

  await db
    .insert(newsLabels)
    .values({
      newsId: prediction.newsId,
      label: prediction.label,
      labelSource: "ai_approved",
      labeledBy: user.id,
    })
    .onConflictDoUpdate({
      target: newsLabels.newsId,
      set: {
        label: prediction.label,
        labelSource: "ai_approved",
        labeledBy: user.id,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath(`/news/${prediction.newsId}`);
}

export async function deactivateModelAction(data: FormData) {
  await assertAdmin();
  if (!hasDatabase) throw new Error("Database is not configured.");

  const modelId = uuidSchema.parse(value(data, "modelId"));
  try {
    const updated = await getDb().update(mlModels).set({ isActive: false, status: "ready", updatedAt: new Date() }).where(and(
      eq(mlModels.id, modelId),
      eq(mlModels.status, "ready"),
      eq(mlModels.isActive, true),
    )).returning({ id: mlModels.id });
    if (!updated.length) throw new Error("Model tidak aktif atau tidak ditemukan.");
  } catch (error) {
    console.error("Classification model deactivation failed", { modelId, error });
    throw error;
  }
  revalidateClassification();
}
