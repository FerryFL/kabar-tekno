import { ActivityIcon, FlameIcon, TargetIcon } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
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

export default async function GoalsPage() {
  const [summary, recentDates] = await Promise.all([
    getGoalSummary(),
    getRecentReadDates(),
  ]);

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
                  Baca kabar harian secara konsisten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-5xl font-semibold">
                  {summary.goal.streaks}
                </p>
                <p className="text-sm text-muted-foreground">hari</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ActivityIcon />
                  Minimal Bacaan
                </CardTitle>
                <CardDescription>10 bacaan per hari juga udah cukup kok</CardDescription>
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