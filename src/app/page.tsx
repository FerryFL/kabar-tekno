import { NewsSections } from "@/components/app/news-sections";
import { DailyGoalCard } from "@/components/app/daily-goal-card";
import { PageHeader } from "@/components/app/page-header";
import { SearchForm } from "@/components/app/search-form";
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
                <DailyGoalCard
                  readsToday={goal.readsToday}
                  minimumArticle={goal.goal.minimumArticle}
                  completionPercent={goal.completionPercent}
                  streaks={goal.goal.streaks}
                />
              </aside>
            ) : null
          }
        </div>
      </main>
    </>
  );
}
