import { NewsSections } from "@/components/app/news-sections";
import { PageHeader } from "@/components/app/page-header";
import { SearchForm } from "@/components/app/search-form";
import {
  getSavedNewsSectionsPage,
  parseListParams,
} from "@/features/news/queries";

export default async function SavedPage({ searchParams }: PageProps<"/saved">) {
  const rawSearchParams = await searchParams;
  const params = parseListParams(rawSearchParams);
  const newsPage = await getSavedNewsSectionsPage(params);

  return (
    <>
      <PageHeader
        eyebrow="Berita yang Disimpan"
        title="Disimpan"
        description="Baca kembali berita yang disimpan."
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <SearchForm q={params.q} placeholder="Cari berita yang disimpan" />
        <NewsSections
          basePath="/saved"
          searchParams={rawSearchParams}
          sections={newsPage.sections}
        />
      </main>
    </>
  );
}
