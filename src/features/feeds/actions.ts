"use server";

import Parser from "rss-parser";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb, hasDatabase } from "@/db";
import { feedSources, news } from "@/db/schema";
import { isAdmin } from "@/lib/admin";

const feedSchema = z.object({
  name: z.string().trim().min(2).max(80),
  url: z.string().trim().url(),
});

const feedIdSchema = z.string().uuid();

type RssItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  isoDate?: string;
  pubDate?: string;
  guid?: string;
  enclosure?: {
    url?: string;
  };
};

const parser = new Parser<Record<string, unknown>, RssItem>();

export async function createFeedSource(formData: FormData) {
  if (!(await isAdmin())) {
    return;
  }

  const parsed = feedSchema.safeParse({
    name: formData.get("name"),
    url: formData.get("url"),
  });

  if (!parsed.success) {
    return;
  }

  if (!hasDatabase) {
    return;
  }

  const db = getDb();
  await db
    .insert(feedSources)
    .values({
      name: parsed.data.name,
      url: parsed.data.url,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: feedSources.url,
      set: {
        name: parsed.data.name,
        isActive: true,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/");
  revalidatePath("/admin/feeds");
}

export async function updateFeedSource(formData: FormData) {
  if (!(await isAdmin())) {
    return;
  }

  const id = feedIdSchema.safeParse(formData.get("id"));
  const parsed = feedSchema.safeParse({
    name: formData.get("name"),
    url: formData.get("url"),
  });

  if (!id.success || !parsed.success || !hasDatabase) {
    return;
  }

  const db = getDb();
  await db
    .update(feedSources)
    .set({
      name: parsed.data.name,
      url: parsed.data.url,
      updatedAt: new Date(),
    })
    .where(eq(feedSources.id, id.data));

  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath("/admin/feeds");
}

export async function deleteFeedSource(formData: FormData) {
  if (!(await isAdmin())) {
    return;
  }

  const id = feedIdSchema.safeParse(formData.get("id"));
  if (!id.success || !hasDatabase) {
    return;
  }

  const db = getDb();
  await db.delete(feedSources).where(eq(feedSources.id, id.data));

  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath("/admin/feeds");
}

export async function refreshFeedsAction() {
  if (!(await isAdmin())) {
    return;
  }

  await refreshFeeds();
  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath("/admin/feeds");
}

export async function refreshFeeds() {
  if (!hasDatabase) {
    return {
      ok: false,
      message: "Configure DATABASE_URL to refresh feeds.",
    };
  }

  const db = getDb();
  const sources = await db.query.feedSources.findMany();
  let inserted = 0;
  const failedSources: string[] = [];

  for (const source of sources.filter((item) => item.isActive)) {
    try {
      const feed = await parser.parseURL(source.url);
      const items = feed.items.slice(0, 25);

      for (const item of items) {
        if (!item.title || !item.link) {
          continue;
        }

        const publishedAt = parsePublishedAt(item);
        if (!publishedAt) {
          continue;
        }

        await db
          .insert(news)
          .values({
            sourceId: source.id,
            title: item.title,
            description: item.contentSnippet ?? item.content ?? null,
            link: item.link,
            image: getItemImage(item),
            guid: item.guid ?? null,
            publishedAt,
          })
          .onConflictDoUpdate({
            target: news.link,
            set: {
              sourceId: source.id,
              title: item.title,
              description: item.contentSnippet ?? item.content ?? null,
              image: getItemImage(item),
              guid: item.guid ?? null,
              publishedAt,
            },
          });
        inserted += 1;
      }

      await db
        .update(feedSources)
        .set({ updatedAt: new Date() })
        .where(eq(feedSources.id, source.id));
    } catch {
      failedSources.push(source.name);
    }
  }

  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath("/admin/feeds");

  if (failedSources.length > 0 && inserted === 0) {
    return {
      ok: false,
      message: `Could not refresh: ${failedSources.join(", ")}.`,
    };
  }

  const failedMessage =
    failedSources.length > 0
      ? ` Failed feeds: ${failedSources.join(", ")}.`
      : "";
  return {
    ok: true,
    message: `Refreshed ${inserted} articles.${failedMessage}`,
  };
}

function parsePublishedAt(item: RssItem) {
  const value = item.isoDate ?? item.pubDate;
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getItemImage(item: RssItem) {
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }

  const rawItem = item as RssItem & Record<string, unknown>;
  const mediaContent = rawItem["media:content"];
  if (
    mediaContent &&
    typeof mediaContent === "object" &&
    "url" in mediaContent &&
    typeof mediaContent.url === "string"
  ) {
    return mediaContent.url;
  }

  const html = item.content ?? "";
  return html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
}
