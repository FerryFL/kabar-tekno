import Link from "next/link";
import {
  BookmarkIcon,
  CheckCheckIcon,
  ClockIcon,
  ExternalLinkIcon,
} from "lucide-react";

import { toggleBookmark } from "@/features/news/actions";
import type { NewsListItem } from "@/features/news/types";
import { formatShortDate, formatTime } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function NewsCard({ item }: { item: NewsListItem }) {
  return (
    <Card className="border-border/60 bg-card/70 transition-colors hover:bg-card">
      <div className="h-0.5 bg-secondary" />
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            {item.sourceName}
          </Badge>
          <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <ClockIcon />
            {formatShortDate(item.publishedAt)} {formatTime(item.publishedAt)}
          </span>
        </div>
        <CardTitle className="text-lg">
          <Link
            href={`/news/${item.id}`}
            className="hover:text-primary focus:text-primary active:text-primary"
          >
            {item.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {item.description ?? "No summary is available for this article."}
        </CardDescription>
        <CardAction>
          <form action={toggleBookmark.bind(null, item.id)}>
            <Button
              type="submit"
              size="icon-sm"
              variant={item.isBookmarked ? "default" : "outline"}
              aria-label={item.isBookmarked ? "Remove bookmark" : "Save news"}
            >
              <BookmarkIcon />
            </Button>
          </form>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/news/${item.id}`}
            className="font-mono text-xs text-primary underline-offset-4 hover:underline"
          >
            Buka artikel
          </Link>
          {item.isRead ? (
            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <CheckCheckIcon className="size-4" />
              Telah dibaca
            </span>
          ) : null}
        </div>
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Sumber
          <ExternalLinkIcon data-icon="inline-end" />
        </a>
      </CardContent>
    </Card >
  );
}
