import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { getDb, hasDatabase } from "@/db";
import { mlEvaluationRuns, mlModels, news, newsLabels, newsPredictions } from "@/db/schema";

export async function getClassificationDataset() {
  if (!hasDatabase) return [];

  return getDb()
    .select({
      id: news.id,
      title: news.title,
      description: news.description,
      label: newsLabels.label,
    })
    .from(newsLabels)
    .innerJoin(news, eq(newsLabels.newsId, news.id))
    .orderBy(desc(news.publishedAt));
}

export async function getUnlabeledNews({
  page = 1,
  pageSize = 20,
  query = "",
}: {
  page?: number;
  pageSize?: number;
  query?: string;
} = {}) {
  if (!hasDatabase) {
    return { items: [], total: 0, page, pageSize, pageCount: 1 };
  }

  const rows = await getDb()
    .select({
      id: news.id,
      title: news.title,
      description: news.description,
      publishedAt: news.publishedAt,
      labelId: newsLabels.id,
      label: newsLabels.label,
      predictionId: sql<string | null>`(
        select ${newsPredictions.id}
        from ${newsPredictions}
        where ${newsPredictions.newsId} = ${news.id}
        order by ${newsPredictions.predictedAt} desc
        limit 1
      )`,
      predictionLabel: sql<"baik" | "buruk" | "netral" | null>`(
        select ${newsPredictions.label}
        from ${newsPredictions}
        where ${newsPredictions.newsId} = ${news.id}
        order by ${newsPredictions.predictedAt} desc
        limit 1
      )`,
      predictionConfidence: sql<number | null>`(
        select ${newsPredictions.confidence}::numeric
        from ${newsPredictions}
        where ${newsPredictions.newsId} = ${news.id}
        order by ${newsPredictions.predictedAt} desc
        limit 1
      )`,
      total: sql<number>`count(*) over()`,
    })
    .from(news)
    .leftJoin(newsLabels, eq(newsLabels.newsId, news.id))
    .where(and(
      isNull(newsLabels.id),
      eq(news.isArchived, false),
      query
        ? sql`(${news.title} ilike ${`%${query}%`} or ${news.description} ilike ${`%${query}%`})`
        : undefined,
    ))
    .orderBy(desc(news.publishedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const total = rows[0]?.total ?? 0;
  const items = rows.map((row) => {
    const { total: _total, ...item } = row;
    void _total;
    return item;
  });

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getModels() {
  if (!hasDatabase) return [];
  return getDb().select().from(mlModels).orderBy(desc(mlModels.createdAt));
}

export async function getEvaluationRuns() {
  if (!hasDatabase) return [];
  return getDb().select().from(mlEvaluationRuns).orderBy(desc(mlEvaluationRuns.startedAt));
}

export async function getLatestPredictions(newsIds: string[], modelId?: string) {
  if (!hasDatabase || newsIds.length === 0) return [];

  const rows = await getDb()
    .select()
    .from(newsPredictions)
    .where(and(
      sql`${newsPredictions.newsId} in ${sql.join(newsIds.map((id) => sql`${id}::uuid`), sql`, `)}`,
      modelId ? eq(newsPredictions.modelId, modelId) : undefined,
    ))
    .orderBy(desc(newsPredictions.predictedAt));
  const seen = new Set<string>();

  return rows.filter((row) => !seen.has(row.newsId) && seen.add(row.newsId));
}

export async function getRecentPredictions() {
  if (!hasDatabase) return [];

  return getDb()
    .select({
      id: newsPredictions.id,
      newsTitle: news.title,
      modelId: newsPredictions.modelId,
      label: newsPredictions.label,
      confidence: newsPredictions.confidence,
      predictedAt: newsPredictions.predictedAt,
    })
    .from(newsPredictions)
    .innerJoin(news, eq(newsPredictions.newsId, news.id))
    .orderBy(desc(newsPredictions.predictedAt))
    .limit(10);
}
