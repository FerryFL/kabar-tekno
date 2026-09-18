"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb, hasDatabase } from "@/db";
import { bookmarks, readArticles } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { toDateKey } from "@/lib/dates";

export async function toggleBookmark(newsId: string) {
  if (!hasDatabase) {
    return;
  }

  const db = getDb();
  const user = await getCurrentUser();
  if (!user) {
    return;
  }
  const existing = await db.query.bookmarks.findFirst({
    where: and(eq(bookmarks.userId, user.id), eq(bookmarks.newsId, newsId)),
  });

  if (existing) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
  } else {
    await db
      .insert(bookmarks)
      .values({ userId: user.id, newsId })
      .onConflictDoNothing({
        target: [bookmarks.userId, bookmarks.newsId],
      });
  }

  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath(`/news/${newsId}`);
}

export async function markNewsRead(newsId: string) {
  if (!hasDatabase) {
    return;
  }

  const db = getDb();
  const user = await getCurrentUser();
  if (!user) {
    return;
  }
  const today = toDateKey(new Date());

  await db
    .insert(readArticles)
    .values({
      userId: user.id,
      newsId,
      readDate: today,
    })
    .onConflictDoNothing({
      target: [readArticles.userId, readArticles.newsId, readArticles.readDate],
    });

  revalidatePath("/goals");
  revalidatePath("/");
  revalidatePath("/saved");
}
