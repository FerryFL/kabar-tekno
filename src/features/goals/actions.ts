"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb, hasDatabase } from "@/db";
import { goals } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";

const goalSchema = z.object({
  minimumArticle: z.coerce.number().int().min(1).max(100),
});

export async function updateGoal(formData: FormData) {
  const parsed = goalSchema.safeParse({
    minimumArticle: formData.get("minimumArticle"),
  });

  if (!parsed.success) {
    return;
  }

  if (!hasDatabase) {
    return;
  }

  const db = getDb();
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  await db
    .insert(goals)
    .values({
      userId: user.id,
      minimumArticle: parsed.data.minimumArticle,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: goals.userId,
      set: {
        minimumArticle: parsed.data.minimumArticle,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/goals");
}
