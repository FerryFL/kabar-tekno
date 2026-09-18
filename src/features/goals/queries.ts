import { and, count, desc, eq } from "drizzle-orm";

import { getDb, hasDatabase } from "@/db";
import { goals, readArticles } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { toDateKey } from "@/lib/dates";
import { logServerTiming } from "@/lib/server-timing";
import type { GoalSummary } from "@/features/news/types";

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
  let goal = await db.query.goals.findFirst({
    where: eq(goals.userId, user.id),
  });

  if (!goal) {
    [goal] = await db
      .insert(goals)
      .values({ userId: user.id })
      .onConflictDoNothing({ target: goals.userId })
      .returning();
    if (!goal) {
      goal = await db.query.goals.findFirst({
        where: eq(goals.userId, user.id),
      });
    }
  }

  if (!goal) {
    return null;
  }

  const today = toDateKey(new Date());
  const [readCount] = await db
    .select({ value: count() })
    .from(readArticles)
    .where(
      and(eq(readArticles.userId, user.id), eq(readArticles.readDate, today)),
    );

  const readsToday = readCount?.value ?? 0;

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
