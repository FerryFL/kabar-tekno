import type { FeedSource, Goal, News } from "@/db/schema";

export interface NewsListItem extends News {
  sourceName: string;
  isBookmarked: boolean;
  isRead?: boolean;
}

export type NewsSectionKey = "today" | "yesterday" | "previous";

export interface NewsSectionPage {
  key: NewsSectionKey;
  label: string;
  pageParam: string;
  items: NewsListItem[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export interface GoalSummary {
  goal: Goal;
  readsToday: number;
  completionPercent: number;
  completedToday: boolean;
}

export interface FeedSourceSummary extends FeedSource {
  newsCount: number;
}
