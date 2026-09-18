import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  supabaseUserId: text("supabase_user_id").unique(),
  googleAccount: text("google_account").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const feedSources = pgTable(
  "feed_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    url: text("url").notNull().unique(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("feed_sources_active_idx").on(table.isActive),
    uniqueIndex("feed_sources_url_idx").on(table.url),
  ],
);

export const news = pgTable(
  "news",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => feedSources.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    title: text("title").notNull(),
    description: text("description"),
    link: text("link").notNull().unique(),
    image: text("image"),
    guid: text("guid"),
    publishedAt: timestamp("published_at", {
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("news_source_id_idx").on(table.sourceId),
    index("news_published_at_idx").on(table.publishedAt),
    uniqueIndex("news_link_idx").on(table.link),
  ],
);

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    newsId: uuid("news_id")
      .notNull()
      .references(() => news.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("bookmarks_user_id_idx").on(table.userId),
    index("bookmarks_news_id_idx").on(table.newsId),
    index("bookmarks_created_at_idx").on(table.createdAt),
    uniqueIndex("bookmarks_user_news_idx").on(table.userId, table.newsId),
  ],
);

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    streaks: integer("streaks").default(0).notNull(),
    minimumArticle: integer("minimum_article").default(10).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("goals_user_id_idx").on(table.userId)],
);

export const readArticles = pgTable(
  "read_articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    newsId: uuid("news_id")
      .notNull()
      .references(() => news.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
    readDate: date("read_date").notNull(),
  },
  (table) => [
    index("read_articles_user_id_idx").on(table.userId),
    index("read_articles_news_id_idx").on(table.newsId),
    index("read_articles_user_date_idx").on(table.userId, table.readDate),
    uniqueIndex("read_articles_user_news_date_idx").on(
      table.userId,
      table.newsId,
      table.readDate,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type FeedSource = typeof feedSources.$inferSelect;
export type News = typeof news.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type ReadArticle = typeof readArticles.$inferSelect;
