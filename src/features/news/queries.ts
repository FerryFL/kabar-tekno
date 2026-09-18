import { and, desc, eq, gte, ilike, lt, or, sql } from "drizzle-orm";

import { getDb, hasDatabase } from "@/db";
import { bookmarks, feedSources, news, readArticles } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getJakartaDayKeys } from "@/lib/dates";
import { logServerTiming } from "@/lib/server-timing";

import type { NewsListItem, NewsSectionKey, NewsSectionPage } from "./types";

interface SectionQueryResult {
  items: NewsListItem[];
  total: number;
}

const PAGE_SIZE = 10;

const SECTION_KEYS: NewsSectionKey[] = ["today", "yesterday", "previous"];
const SECTION_LABELS: Record<NewsSectionKey, string> = {
  today: "Hari ini",
  yesterday: "Kemarin",
  previous: "Sebelumnya",
};

const SECTION_PAGE_PARAMS: Record<NewsSectionKey, string> = {
  today: "today",
  yesterday: "yesterday",
  previous: "previous",
};

function firstValue(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

const MAX_PAGE = 10_000;
function normalizePage(value?: string | string[]): number {
  const parsed = Number.parseInt(firstValue(value) ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  if (parsed > MAX_PAGE) return MAX_PAGE;

  return parsed;
}

function normalizeQuery(value?: string | string[]): string {
  return firstValue(value)?.trim() ?? ""
}

interface ParseListParams {
  q?: string | string[];
  today?: string | string[];
  yesterday?: string | string[];
  previous?: string | string[];
}

interface ListParams {
  q: string;
  pages: Record<NewsSectionKey, number>;
}

export function parseListParams(searchParams: ParseListParams): ListParams {
  return {
    q: normalizeQuery(searchParams.q),
    pages: {
      today: normalizePage(searchParams.today),
      yesterday: normalizePage(searchParams.yesterday),
      previous: normalizePage(searchParams.previous),
    },
  };
}

interface NewsSectionResult {
  sections: NewsSectionPage[]
}

export async function getNewsSectionsPage({ q, pages }: ListParams): Promise<NewsSectionResult> {
  const sections = await getDatabaseNewsSections({ q, pages });
  return { sections };
}

export async function getSavedNewsSectionsPage({ q, pages }: ListParams): Promise<NewsSectionResult> {
  const sections = await getDatabaseSavedNewsSections({ q, pages });
  return { sections };
}

export async function getNewsById(id: string) {
  if (!hasDatabase) {
    return null;
  }

  const db = getDb();
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  const [item] = await db
    .select({
      id: news.id,
      sourceId: news.sourceId,
      sourceName: feedSources.name,
      title: news.title,
      description: news.description,
      link: news.link,
      image: news.image,
      guid: news.guid,
      publishedAt: news.publishedAt,
      createdAt: news.createdAt,
      isBookmarked: sql<boolean>`${bookmarks.id} is not null`,
      isRead: sql<boolean>`exists (
        select 1 from ${readArticles}
        where ${readArticles.userId} = ${user.id}
          and ${readArticles.newsId} = ${news.id}
      )`,
    })
    .from(news)
    .innerJoin(feedSources, eq(news.sourceId, feedSources.id))
    .leftJoin(
      bookmarks,
      and(eq(bookmarks.newsId, news.id), eq(bookmarks.userId, user.id)),
    )
    .where(eq(news.id, id))
    .limit(1);

  return item ?? null;
}

function searchWhere(q: string) {
  if (!q) {
    return undefined;
  }

  const term = `%${q}%`;
  return or(
    ilike(news.title, term),
    ilike(news.description, term),
    ilike(feedSources.name, term),
  );
}

async function getDatabaseNewsSections({ q, pages }: ListParams) {
  const startedAt = performance.now();
  const db = getDb();
  const user = await getCurrentUser();
  if (!user) {
    return buildSectionPages(
      SECTION_KEYS.map(() => ({
        items: [],
        total: 0,
      })),
      pages,
    );
  }

  const results = await Promise.all(
    SECTION_KEYS.map((key) =>
      queryNewsSection({
        db,
        userId: user.id,
        q,
        key,
        requestedPage: pages[key],
        savedOnly: false
      }),
    ),
  );

  logServerTiming("news.sections.total", startedAt, { sections: SECTION_KEYS.length });
  return buildSectionPages(results, pages);
}

async function getDatabaseSavedNewsSections({ q, pages }: ListParams) {
  const startedAt = performance.now();
  const db = getDb();
  const user = await getCurrentUser();
  if (!user) {
    return buildSectionPages(
      SECTION_KEYS.map(() => ({
        items: [],
        total: 0,
      })),
      pages,
    );
  }

  const results = await Promise.all(
    SECTION_KEYS.map((key) =>
      queryNewsSection({
        db,
        userId: user.id,
        q,
        key,
        requestedPage: pages[key],
        savedOnly: true,
      }),
    ),
  );

  logServerTiming("saved-news.sections.total", startedAt, { sections: SECTION_KEYS.length });
  return buildSectionPages(results, pages);
}

function buildSectionPages(results: SectionQueryResult[], pages: Record<NewsSectionKey, number>) {
  return SECTION_KEYS.map((key, index) => {
    const result = results[index] ?? { items: [], total: 0 };
    const total = result.total;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(Math.max(pages[key], 1), pageCount);

    return {
      key,
      label: SECTION_LABELS[key],
      pageParam: SECTION_PAGE_PARAMS[key],
      items: result.items,
      page,
      pageSize: PAGE_SIZE,
      total,
      pageCount,
    };
  });
}

function sectionDateWhere(key: NewsSectionKey) {
  const { today, yesterday } = getJakartaDayKeys();
  const todayStart = jakartaDateKeyToUtc(today);
  const yesterdayStart = jakartaDateKeyToUtc(yesterday);
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  if (key === "today") {
    return and(gte(news.publishedAt, todayStart), lt(news.publishedAt, tomorrowStart));
  }

  if (key === "yesterday") {
    return and(gte(news.publishedAt, yesterdayStart), lt(news.publishedAt, todayStart));
  }

  return or(
    lt(news.publishedAt, yesterdayStart),
    gte(news.publishedAt, tomorrowStart),
  );
}

function jakartaDateKeyToUtc(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+07:00`);
}

interface QueryNewsSection {
  db: ReturnType<typeof getDb>;
  userId: string;
  q: string;
  key: NewsSectionKey;
  requestedPage: number;
  savedOnly: boolean;
}

async function queryNewsSection({ db, userId, q, key, requestedPage, savedOnly = false }: QueryNewsSection): Promise<SectionQueryResult> {
  const startedAt = performance.now();
  const baseWhere = and(sectionDateWhere(key), searchWhere(q));
  const where = savedOnly ? and(eq(bookmarks.userId, userId), baseWhere) : baseWhere;

  const selectColumns = {
    id: news.id,
    sourceId: news.sourceId,
    sourceName: feedSources.name,
    title: news.title,
    description: news.description,
    link: news.link,
    image: news.image,
    guid: news.guid,
    publishedAt: news.publishedAt,
    createdAt: news.createdAt,
    isBookmarked: savedOnly ? sql<boolean>`true` : sql<boolean>`${bookmarks.id} is not null`,
    isRead: sql<boolean>`exists (
      select 1 from ${readArticles}
      where ${readArticles.userId} = ${userId}
        and ${readArticles.newsId} = ${news.id}
    )`,
    total: sql<number>`count(*) over()`,
  };

  const itemsQuery = savedOnly
    ? db
      .select(selectColumns)
      .from(bookmarks)
      .innerJoin(news, eq(bookmarks.newsId, news.id))
      .innerJoin(feedSources, eq(news.sourceId, feedSources.id))
    : db
      .select(selectColumns)
      .from(news)
      .innerJoin(feedSources, eq(news.sourceId, feedSources.id))
      .leftJoin(
        bookmarks,
        and(eq(bookmarks.newsId, news.id), eq(bookmarks.userId, userId)),
      );

  const selectStartedAt = performance.now();
  const rawItems = await itemsQuery
    .where(where)
    .orderBy(desc(news.publishedAt), desc(news.createdAt))
    .limit(PAGE_SIZE)
    .offset((Math.max(requestedPage, 1) - 1) * PAGE_SIZE);

  const total = rawItems[0]?.total ?? 0;
  const items = rawItems.map(({ total: _total, ...item }) => item);

  logServerTiming(savedOnly ? "saved-news.section.select" : "news.section.select", selectStartedAt, {
    section: key,
  });
  logServerTiming(savedOnly ? "saved-news.section.total" : "news.section.total", startedAt, {
    section: key,
  });

  return { items, total };
}
