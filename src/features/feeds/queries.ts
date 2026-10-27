import { and, count, desc, eq } from "drizzle-orm";

import { getDb, hasDatabase } from "@/db";
import { feedSources, news } from "@/db/schema";
import type { FeedSourceSummary } from "@/features/news/types";

export async function getFeedSources(): Promise<FeedSourceSummary[]> {
  if (!hasDatabase) {
    return [];
  }

  const db = getDb();
  return db
    .select({
      id: feedSources.id,
      name: feedSources.name,
      url: feedSources.url,
      isActive: feedSources.isActive,
      createdAt: feedSources.createdAt,
      updatedAt: feedSources.updatedAt,
      newsCount: count(news.id),
    })
    .from(feedSources)
    .leftJoin(news, and(eq(news.sourceId, feedSources.id), eq(news.isArchived, false)))
    .groupBy(feedSources.id)
    .orderBy(desc(feedSources.createdAt));
}
