import { ListPagination } from "@/components/app/list-pagination";
import type { SearchParams } from "@/components/app/list-pagination";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

  const initiallyOpenSection = sections.find((section) => section.total > 0)?.key;

  return (
    <Accordion
      defaultValue={initiallyOpenSection ? [initiallyOpenSection] : []}
      multiple={false}
      className="flex flex-col gap-3"
    >
      {sections.map((section) =>
        section.total > 0 ? (
          <AccordionItem
            key={section.key}
            value={section.key}
            className="rounded-xl border px-4"
          >
            <AccordionTrigger className="py-4 hover:no-underline">
              <span className="flex items-center gap-3">
                <span className="font-heading text-lg font-semibold">
                  {section.label}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {section.total} artikel
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
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
            </AccordionContent>
          </AccordionItem>
        ) : null,
      )}
    </Accordion>
  );
}
