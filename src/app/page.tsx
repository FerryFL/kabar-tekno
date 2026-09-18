import { NewsSections } from "@/components/app/news-sections";
import { PageHeader } from "@/components/app/page-header";
import { SearchForm } from "@/components/app/search-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGoalSummary } from "@/features/goals/queries";
import { getNewsSectionsPage, parseListParams } from "@/features/news/queries";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = parseListParams(await searchParams);
  const [newsPage, goal] = await Promise.all([
    getNewsSectionsPage(params),
    getGoalSummary(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Berita Terkini"
        title="Beranda"
        description="Baca berita teknologi dan AI dari berbagai sumber."
      />
      <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-9">
            <SearchForm q={params.q} placeholder="Cari sumber, judul, atau ringkasan" />
            <NewsSections
              basePath="/"
              searchParams={await searchParams}
              sections={newsPage.sections}
            />
          </div>
          {
            goal ? (
              <aside className="sticky h-fit lg:top-28 bottom-0 w-full z-8 lg:col-span-3 flex flex-col lg:gap-3 p-4 lg:pt-0 lg:px-2 border-t-3 lg:border-0 bg-background/80 backdrop-blur-sm shadow-2xl rounded-t-xl">
                <Card>
                  <CardHeader>
                    <CardTitle>Target Harian</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 lg:gap-3">
                    <div className="flex items-end gap-2">
                      <span className="font-heading text-4xl font-semibold">
                        {goal.readsToday}
                      </span>
                      <span className="pb-1 text-sm text-muted-foreground">
                        / {goal.goal.minimumArticle} bacaan
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-secondary"
                        style={{
                          width: `${goal.completionPercent}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Streak berlangsung: {goal.goal.streaks} hari
                    </p>
                  </CardContent>
                </Card>
              </aside>
            ) : null
          }
        </div>
      </main>
    </>
  );
}
