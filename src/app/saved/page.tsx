import { NewsSections } from "@/components/app/news-sections";
import { PageHeader } from "@/components/app/page-header";
import { SearchForm } from "@/components/app/search-form";
import { GoogleAuthButton } from "@/components/app/google-auth-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/current-user";
import {
  getSavedNewsSectionsPage,
  parseListParams,
} from "@/features/news/queries";

export default async function SavedPage({ searchParams }: PageProps<"/saved">) {
  const rawSearchParams = await searchParams;
  const params = parseListParams(rawSearchParams);
  const user = await getCurrentUser();
  if (!user) {
    return (
      <>
        <PageHeader
          eyebrow="Berita yang Disimpan"
          title="Disimpan"
          description="Masuk untuk menyimpan dan membaca kembali berita pilihanmu."
        />
        <main className="flex flex-1 items-start justify-center p-4 md:p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Masuk untuk melihat berita tersimpan</CardTitle>
              <CardDescription>Berita tersimpan terhubung ke akun Google milikmu.</CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleAuthButton next="/saved" className="w-full" />
            </CardContent>
          </Card>
        </main>
      </>
    );
  }
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
