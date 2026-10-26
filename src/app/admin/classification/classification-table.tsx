"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/app/action-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { approvePredictionAction, labelNewsAction, labelNewsBulkAction, predictNewsAction } from "@/features/classification/actions";

type Item = {
  id: string;
  title: string;
  description: string | null;
  publishedAt: Date;
  labelId: string | null;
  label: "baik" | "buruk" | "netral" | null;
  predictionId: string | null;
  predictionLabel: "baik" | "buruk" | "netral" | null;
  predictionConfidence: number | null;
};

type Model = {
  id: string;
  version: string;
  status: string;
  isActive: boolean;
};

export function ClassificationTable({
  items,
  models,
}: {
  items: Item[];
  models: Model[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  return (
    <>
      <ActionForm action={labelNewsBulkAction} className="mb-4 flex flex-wrap items-center gap-2">
        {selected.map((id) => (
          <input key={id} type="hidden" name="newsIds" value={id} />
        ))}
        <select name="label" defaultValue="netral" className="h-8 rounded-lg border bg-background px-2 text-sm">
          <option value="baik">Baik</option>
          <option value="buruk">Buruk</option>
          <option value="netral">Netral</option>
        </select>
        <Button type="submit" disabled={!selected.length}>
          Labeli {selected.length || "terpilih"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Label manual tidak ditimpa prediction.
        </span>
      </ActionForm>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <input
                type="checkbox"
                checked={selected.length === items.length && items.length > 0}
                onChange={(event) =>
                  setSelected(event.target.checked ? items.map((item) => item.id) : [])
                }
              />
            </TableHead>
            <TableHead>Berita</TableHead>
            <TableHead>Terbit</TableHead>
            <TableHead>Label</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() => toggle(item.id)}
                />
              </TableCell>
              <TableCell className="min-w-72 max-w-xl whitespace-normal">
                <div className="font-medium">{item.title}</div>
                <div className="line-clamp-1 text-xs text-muted-foreground">
                  {item.description}
                </div>
              </TableCell>
              <TableCell className="text-xs">
                {item.publishedAt.toLocaleDateString("id-ID")}
              </TableCell>
              <TableCell>
                <ActionForm action={labelNewsAction} className="flex gap-1">
                  <input type="hidden" name="newsId" value={item.id} />
                  <select name="label" defaultValue="netral" className="h-7 rounded-md border bg-background px-1 text-xs">
                    <option value="baik">Baik</option>
                    <option value="buruk">Buruk</option>
                    <option value="netral">Netral</option>
                  </select>
                  <Button size="sm" type="submit">Simpan</Button>
                </ActionForm>
                {item.predictionId && item.predictionLabel ? (
                  <ActionForm action={approvePredictionAction} className="mt-2 flex items-center gap-2">
                    <input type="hidden" name="predictionId" value={item.predictionId} />
                    <Badge variant="outline">
                      AI: {item.predictionLabel} ({((item.predictionConfidence ?? 0) * 100).toFixed(0)}%)
                    </Badge>
                    <Button size="sm" variant="outline" type="submit">Jadikan label</Button>
                  </ActionForm>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ActionForm action={predictNewsAction} className="mt-4 flex flex-wrap gap-2">
        {selected.map((id) => (
          <input key={id} type="hidden" name="newsIds" value={id} />
        ))}
        <select name="modelId" required defaultValue="" className="h-8 rounded-lg border bg-background px-2 text-sm">
          <option value="" disabled>Pilih model aktif</option>
          {models
            .filter((model) => model.status === "ready" && model.isActive)
            .map((model) => (
              <option key={model.id} value={model.id}>{model.version}</option>
            ))}
        </select>
        <Button type="submit" variant="secondary" disabled={!selected.length}>
          Predict terpilih
        </Button>
      </ActionForm>
    </>
  );
}
