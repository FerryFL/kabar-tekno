import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export type SearchParams = Record<string, string | string[] | undefined>;

function hrefFor(basePath: string, page: number, pageParam: string, searchParams: SearchParams) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  }

  if (page > 1) params.set(pageParam, String(page));
  else params.delete(pageParam);

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

interface ListPagination {
  basePath: string;
  page: number;
  pageCount: number;
  pageParam?: string;
  searchParams: SearchParams;
}

export function ListPagination({ basePath, page, pageCount, pageParam = "page", searchParams }: ListPagination) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={hrefFor(basePath, Math.max(1, page - 1), pageParam, searchParams)}
            aria-disabled={page <= 1}
            scroll={false}
          />
        </PaginationItem>
        {pages.map((item) => (
          <PaginationItem key={item}>
            <PaginationLink
              href={hrefFor(basePath, item, pageParam, searchParams)}
              isActive={item === page}
              scroll={false}
            >
              {item}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href={hrefFor(
              basePath,
              Math.min(pageCount, page + 1),
              pageParam,
              searchParams,
            )}
            aria-disabled={page >= pageCount}
            scroll={false}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
