import { ActivityIcon, FlameIcon, TargetIcon } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { GoogleAuthButton } from "@/components/app/google-auth-button";
import { GoalForm } from "@/app/goals/goal-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getGoalSummary, getRecentReadDates } from "@/features/goals/queries";
import { getCurrentUser } from "@/lib/current-user";
import { toDateKey } from "@/lib/dates";

function getLastSevenDays() {
  const today = toDateKey(new Date());
  const [year, month, day] = today.split("-").map(Number);
  const todayUtc = Date.UTC(year, month - 1, day);
  const weekdayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayUtc - (6 - index) * 24 * 60 * 60 * 1000);
    const dateKey = [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, "0"),
      String(date.getUTCDate()).padStart(2, "0"),
    ].join("-");

    return {
      dateKey,
      label: index === 6 ? "Hari Ini" : weekdayLabels[date.getUTCDay()],
      dayNumber: date.getUTCDate(),
    };
  });
}

export default async function GoalsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <>
        <PageHeader
          eyebrow="Progres Target"
          title="Target"
          description="Masuk untuk melihat dan mengatur target bacaanmu."
        />
        <main className="flex flex-1 items-start justify-center p-4 md:p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Masuk untuk melihat target bacaan</CardTitle>
              <CardDescription>
                Progres bacaan dan streak tersimpan di akunmu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleAuthButton next="/goals" className="w-full" />
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const [summary, recentDates] = await Promise.all([
    getGoalSummary(),
    getRecentReadDates(),
  ]);
  const lastSevenDays = getLastSevenDays();
  const readsByDate = new Map(recentDates.map(({ date, count }) => [date, count]));

  return (
    <>
      <PageHeader
        eyebrow="Progres Target"
        title="Target"
        description="Tentukan Target Bacaan Harianmu"
      />
      <main className="grid flex-1 gap-4 p-4 md:grid-cols-3 md:p-6">
        {!summary ? (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Belum bisa menampilkan target</CardTitle>
              <CardDescription>
                Silakan masuk terlebih dahulu untuk melihat dan mengatur target bacaanmu.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TargetIcon />
                  Progres Hari Ini
                </CardTitle>
                <CardDescription>Jumlah bacaan hari ini</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-end gap-2">
                  <span className="font-heading text-5xl font-semibold">
                    {summary.readsToday}
                  </span>
                  <span className="pb-2 text-muted-foreground">
                    / {summary.goal.minimumArticle}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Persentase Penyelesaian</span>
                    <span className="font-mono text-muted-foreground">
                      {summary.completionPercent}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-secondary"
                      style={{
                        width: `${summary.completionPercent}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlameIcon />
                  Streak
                </CardTitle>
                <CardDescription>
                  7 hari terakhir
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-baseline gap-2">
                  <p className="font-heading text-5xl font-semibold">
                    {summary.goal.streaks}
                  </p>
                  <p className="text-sm text-muted-foreground">hari berturut-turut</p>
                </div>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {lastSevenDays.map(({ dateKey, label, dayNumber }, index) => {
                    const isComplete =
                      (readsByDate.get(dateKey) ?? 0) >= summary.goal.minimumArticle;

                    return (
                      <div
                        key={dateKey}
                        className="flex min-w-0 flex-col items-center gap-2"
                      >
                        <span className="truncate text-[10px] text-muted-foreground sm:text-xs">
                          {label}
                        </span>
                        <span
                          aria-label={`${index === 6 ? "Hari ini" : label}, ${isComplete ? "target selesai" : `tanggal ${dayNumber}, target belum selesai`}`}
                          className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold tabular-nums sm:size-9 ${isComplete
                            ? "bg-secondary text-secondary-foreground shadow-sm shadow-secondary/30"
                            : "border border-border bg-muted/50 text-muted-foreground"
                            }`}
                        >
                          {isComplete ? (
                            <FlameIcon className="size-4 fill-current" aria-hidden="true" />
                          ) : (
                            dayNumber
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ActivityIcon />
                  Minimal Bacaan
                </CardTitle>
                <CardDescription>Atur jumlah bacaan minimum per hari</CardDescription>
              </CardHeader>
              <CardContent>
                <GoalForm
                  key={summary.goal.userId}
                  initialMinimumArticle={summary.goal.minimumArticle}
                />
              </CardContent>
            </Card>
          </>
        )}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Bacaan terakhir</CardTitle>
            <CardDescription>
              Riwayat pembacaan artikel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Artikel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDates.length > 0 ? (
                  recentDates.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell className="font-mono">{row.date}</TableCell>
                      <TableCell className="text-right font-mono">
                        {row.count}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      Belum ada aktivitas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
