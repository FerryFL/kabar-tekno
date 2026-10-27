"use server";

import Parser from "rss-parser";
import { eq, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb, hasDatabase } from "@/db";
import { feedSources, news } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { getJakartaDayStart } from "@/lib/dates";

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
    type?: string;
  };
  "media:content"?: RssMediaValue | RssMediaValue[];
  "media:thumbnail"?: RssMediaValue | RssMediaValue[];
  "itunes:image"?: RssMediaValue | RssMediaValue[];
};

type RssMediaValue = {
  url?: string;
  href?: string;
  $?: {
    url?: string;
    href?: string;
  };
};

const parser = new Parser<Record<string, unknown>, RssItem>({
  headers: {
    Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    "User-Agent": "KabarTekno RSS Reader/1.0",
  },
  customFields: {
    item: [
      ["media:content", "media:content", { keepArray: true }],
      ["media:thumbnail", "media:thumbnail", { keepArray: true }],
      ["itunes:image", "itunes:image", { keepArray: true }],
    ],
  },
});

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
  const retentionCutoff = getJakartaDayStart(7);

  await db
    .update(news)
    .set({ isArchived: true })
    .where(lt(news.publishedAt, retentionCutoff));

  const sources = await db.query.feedSources.findMany();
  let inserted = 0;
  const failedSources: string[] = [];

  for (const source of sources.filter((item) => item.isActive)) {
    try {
      const feed = await fetchAndParseFeed(source.url);
      const items = feed.items.slice(0, 25);

      for (const item of items) {
        if (!item.title || !item.link) {
          continue;
        }

        const publishedAt = parsePublishedAt(item);
        if (!publishedAt) {
          continue;
        }
        if (publishedAt < retentionCutoff) {
          continue;
        }

        await db
          .insert(news)
          .values({
            sourceId: source.id,
            title: item.title,
            description: item.contentSnippet ?? item.content ?? null,
            link: item.link,
            image: getItemImage(item, source.url),
            guid: item.guid ?? null,
            publishedAt,
          })
          .onConflictDoUpdate({
            target: news.link,
            set: {
              sourceId: source.id,
              title: item.title,
              description: item.contentSnippet ?? item.content ?? null,
              image: getItemImage(item, source.url),
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
    } catch (error) {
      console.error("Feed refresh failed for source", { sourceId: source.id, source: source.name, error });
      failedSources.push(source.name);
    }
  }

  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath("/admin/feeds");

  if (failedSources.length > 0 && inserted === 0) {
    console.error("Feed refresh failed", { failedSources, inserted });
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

async function fetchAndParseFeed(feedUrl: string) {
  const response = await fetch(feedUrl, {
    cache: "no-store",
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      "User-Agent": "KabarTekno RSS Reader/1.0",
    },
  });

  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    const retryMessage = retryAfter ? ` Retry-After: ${retryAfter}.` : "";
    throw new Error(`Feed returned HTTP ${response.status}.${retryMessage}`);
  }

  return parser.parseString(await response.text());
}

function getItemImage(item: RssItem, feedUrl: string) {
  const rawItem = item as RssItem & Record<string, unknown>;
  const enclosure = item.enclosure?.url;

  if (enclosure && (!item.enclosure?.type || item.enclosure.type.startsWith("image/"))) {
    return resolveImageUrl(enclosure, feedUrl);
  }

  for (const key of ["media:content", "media:thumbnail", "itunes:image"]) {
    const media = rawItem[key];
    const url = getMediaUrl(media);
    if (url) {
      return resolveImageUrl(url, feedUrl);
    }
  }

  const html = item.content ?? "";
  const contentImage = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  return contentImage ? resolveImageUrl(contentImage, feedUrl) : null;
}

function getMediaUrl(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const url = getMediaUrl(entry);
      if (url) return url;
    }
  }

  if (value && typeof value === "object") {
    const media = value as RssMediaValue;
    const url = media.url ?? media.href ?? media.$?.url ?? media.$?.href;

    return typeof url === "string" ? url : null;
  }

  return null;
}

function resolveImageUrl(imageUrl: string, feedUrl: string) {
  try {
    return new URL(imageUrl, feedUrl).toString();
  } catch {
    return imageUrl;
  }
}
