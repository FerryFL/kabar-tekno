import Link from "next/link";
import { redirect } from "next/navigation";
import { BrainCircuitIcon, PlayIcon } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { ActionForm } from "@/components/app/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isAdmin } from "@/lib/admin";
import { activateModelAction, deactivateModelAction, trainAndTestModelAction } from "@/features/classification/actions";
import { getEvaluationRuns, getModels, getRecentPredictions, getUnlabeledNews } from "@/features/classification/queries";

import { ClassificationTable } from "./classification-table";

export default async function ClassificationAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  if (!(await isAdmin())) redirect("/");

  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const query = params.q?.trim() ?? "";

  // Keep these reads sequential because the app pool is intentionally small.
  const { items, total, pageSize, pageCount } = await getUnlabeledNews({ page, query });
  const models = await getModels();
  const runs = await getEvaluationRuns();
  const predictions = await getRecentPredictions();

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Klasifikasi berita"
        description="Label dataset, train model, dan telusuri hasil prediction"
      />
      <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuitIcon />Dataset belum berlabel
              </CardTitle>
              <CardDescription>
                {total} berita menunggu label. Pilih satu atau banyak berita.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="mb-4 flex gap-2">
                <Input name="q" defaultValue={query} placeholder="Cari judul/deskripsi" />
                <Button type="submit" variant="outline">Filter</Button>
              </form>
              <ClassificationTable
                items={items}
                models={models.map((model) => ({
                  id: model.id,
                  version: model.version,
                  status: model.status,
                  isActive: model.isActive,
                }))}
              />
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Halaman {page} dari {pageCount} · {pageSize} per halaman</span>
                <span className="flex gap-2">
                  {page > 1 ? (
                    <Link className="underline" href={`/admin/classification?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                      Sebelumnya
                    </Link>
                  ) : null}
                  {page < pageCount ? (
                    <Link className="underline" href={`/admin/classification?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>
                      Berikutnya
                    </Link>
                  ) : null}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Train & Test</CardTitle>
                <CardDescription>Training dijalankan server-side melalui Flask.</CardDescription>
              </CardHeader>
              <CardContent>
                <ActionForm action={trainAndTestModelAction}>
                  <Button type="submit"><PlayIcon />Mulai training</Button>
                </ActionForm>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model</CardTitle>
                <CardDescription>Status dan aktivasi model.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 h-96 overflow-auto mr-2">
                {models.length ? models.map((model) => (
                  <div key={model.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{model.version}</p>
                        <p className="text-xs text-muted-foreground">
                          {model.algorithm} · {model.status}{model.isActive ? " · aktif" : ""}
                        </p>
                      </div>
                      {model.status === "ready" && model.isActive ? (
                        <ActionForm action={deactivateModelAction}>
                          <input type="hidden" name="modelId" value={model.id} />
                          <Button size="sm" variant="outline" type="submit">Nonaktifkan</Button>
                        </ActionForm>
                      ) : model.status === "ready" ? (
                        <ActionForm action={activateModelAction}>
                          <input type="hidden" name="modelId" value={model.id} />
                          <Button size="sm" variant="outline" type="submit">Aktifkan</Button>
                        </ActionForm>
                      ) : null}
                    </div>
                    {model.metrics && typeof model.metrics === "object" && "accuracy" in model.metrics ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Accuracy: {String(model.metrics.accuracy)} · Macro F1: {String(model.metrics.macro_f1)}
                      </p>
                    ) : null}
                    {model.trainingSampleCount !== null || model.testSampleCount !== null ? (
                      <div className="mt-3 rounded-md bg-muted/50 p-2 text-xs">
                        <p className="font-medium">Data yang digunakan</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
                          <span>Training: {model.trainingSampleCount ?? "-"}</span>
                          <span>Uji: {model.testSampleCount ?? "-"}</span>
                        </div>
                        {model.classDistribution && typeof model.classDistribution === "object" ? (
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
                            <span>Baik: {model.classDistribution.baik ?? 0}</span>
                            <span>Buruk: {model.classDistribution.buruk ?? 0}</span>
                            <span>Netral: {model.classDistribution.netral ?? 0}</span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )) : <p className="text-sm text-muted-foreground">Belum ada model.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Evaluation runs</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {runs.slice(0, 5).map((run) => (
                  <div key={run.id} className="rounded border p-2 text-sm">
                    <div className="flex justify-between">
                      <span>{run.status}</span>
                      <span className="text-muted-foreground">Accuracy {run.accuracy ?? "-"}</span>
                    </div>
                    {run.confusionMatrix ? (
                      <pre className="mt-1 overflow-auto text-[10px] text-muted-foreground">
                        {JSON.stringify(run.confusionMatrix)}
                      </pre>
                    ) : null}
                  </div>
                ))}
                {predictions.length ? (
                  <>
                    <p className="pt-2 text-xs font-medium">Prediction terbaru</p>
                    {predictions.map((prediction) => (
                      <div key={prediction.id} className="flex justify-between text-xs">
                        <span className="max-w-56 truncate">{prediction.newsTitle}</span>
                        <span>{prediction.label} · {Number(prediction.confidence).toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </main >
    </>
  );
}
