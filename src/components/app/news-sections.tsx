import { ListPagination } from "@/components/app/list-pagination";
import type { SearchParams } from "@/components/app/list-pagination";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import type { NewsSectionPage } from "@/features/news/types";

import { NewsCard } from "./news-card";
import { Newspaper } from "lucide-react";

interface NewsSectionsProps {
  basePath: string;
  searchParams: SearchParams;
  sections: NewsSectionPage[];
}

export function NewsSections({ basePath, searchParams, sections }: NewsSectionsProps) {
  if (sections.every((section) => section.total === 0)) {
    return (
      <Empty className="min-h-64 border">
        <EmptyHeader>
          <EmptyTitle>
            <div className="flex gap-2 items-center">
              <Newspaper /> Tidak ada berita ditemukan
            </div>
          </EmptyTitle>
          <EmptyDescription>
            Sesuaikan lagi pencarianmu
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) =>
        section.total > 0 ? (
          <section key={section.key} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">
                {section.label}
              </h2>
              <span className="font-mono text-xs text-muted-foreground">
                {section.total} artikel
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {section.items.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
            <ListPagination
              basePath={basePath}
              page={section.page}
              pageCount={section.pageCount}
              pageParam={section.pageParam}
              searchParams={searchParams}
            />
          </section>
        ) : null,
      )}
    </div>
  );
}
