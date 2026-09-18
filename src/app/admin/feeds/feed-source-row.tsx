"use client";

import { useState } from "react";
import { SaveIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { deleteFeedSource, updateFeedSource } from "@/features/feeds/actions";
import { formatShortDate } from "@/lib/dates";
import type { FeedSourceSummary } from "@/features/news/types";

export function FeedSourceRow({ source }: { source: FeedSourceSummary }) {
  const [name, setName] = useState(source.name);
  const [url, setUrl] = useState(source.url);
  const formId = `edit-feed-${source.id}`;

  return (
    <TableRow>
      <TableCell className="font-medium">
        <form id={formId} action={updateFeedSource}>
          <input type="hidden" name="id" value={source.id} />
        </form>
        <Input
          form={formId}
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label={`Name for ${source.name}`}
          required
        />
      </TableCell>
      <TableCell className="min-w-72">
        <Input
          form={formId}
          name="url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          aria-label={`URL for ${source.name}`}
          required
        />
      </TableCell>
      <TableCell className="text-right font-mono">{source.newsCount}</TableCell>
      <TableCell className="font-mono text-xs">{formatShortDate(source.updatedAt)}</TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Button type="submit" form={formId} size="sm">
            <SaveIcon />
            Simpan
          </Button>
          <form
            action={deleteFeedSource}
            onSubmit={(event) => {
              if (!window.confirm(`Delete ${source.name}? Its news will also be removed.`)) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={source.id} />
            <Button type="submit" size="sm" variant="destructive" aria-label={`Delete ${source.name}`}>
              <Trash2Icon />
              Hapus
            </Button>
          </form>
        </div>
      </TableCell>
    </TableRow>
  );
}
