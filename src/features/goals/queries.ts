import { and, count, desc, eq } from "drizzle-orm";

import { getDb, hasDatabase } from "@/db";
import { goals, readArticles } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { toDateKey } from "@/lib/dates";
import { logServerTiming } from "@/lib/server-timing";
import type { GoalSummary } from "@/features/news/types";

async function findGoalWithReadCount(
  db: ReturnType<typeof getDb>,
  userId: string,
  today: string,
) {
  const [row] = await db
    .select({
      id: goals.id,
      userId: goals.userId,
      streaks: goals.streaks,
      minimumArticle: goals.minimumArticle,
      createdAt: goals.createdAt,
      updatedAt: goals.updatedAt,
      readsToday: count(readArticles.id),
    })
    .from(goals)
    .leftJoin(
      readArticles,
      and(eq(readArticles.userId, userId), eq(readArticles.readDate, today)),
    )
    .where(eq(goals.userId, userId))
    .groupBy(
      goals.id,
      goals.userId,
      goals.streaks,
      goals.minimumArticle,
      goals.createdAt,
      goals.updatedAt,
    )
    .limit(1);

  if (!row) return null;

  const { readsToday, ...goal } = row;
  return { goal, readsToday };
}

export async function getGoalSummary(): Promise<GoalSummary | null> {
  const startedAt = performance.now();
  if (!hasDatabase) {
    return null
  }

  const db = getDb();
  const user = await getCurrentUser();
  if (!user) {
    return null
  }
  const today = toDateKey(new Date());
  let summary = await findGoalWithReadCount(db, user.id, today);

  if (!summary) {
    await db
      .insert(goals)
      .values({ userId: user.id })
      .onConflictDoNothing({ target: goals.userId })
      .execute();
    summary = await findGoalWithReadCount(db, user.id, today);
  }

  if (!summary) {
    return null;
  }

  const { goal, readsToday } = summary;

  logServerTiming("goal.summary.total", startedAt);

  return {
    goal,
    readsToday,
    completionPercent: Math.min(
      100,
      Math.round((readsToday / goal.minimumArticle) * 100),
    ),
    completedToday: readsToday >= goal.minimumArticle,
  };
}

export async function getRecentReadDates(limit = 7) {
  if (!hasDatabase) {
    return [];
  }

  const db = getDb();
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  return db
    .select({
      date: readArticles.readDate,
      count: count(),
    })
    .from(readArticles)
    .where(eq(readArticles.userId, user.id))
    .groupBy(readArticles.readDate)
    .orderBy(desc(readArticles.readDate))
    .limit(limit);
}
