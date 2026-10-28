"use client";

import { ChevronDownIcon, FlameIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DailyGoalCardProps {
  readsToday: number;
  minimumArticle: number;
  completionPercent: number;
  streaks: number;
}

export function DailyGoalCard({
  readsToday,
  minimumArticle,
  completionPercent,
  streaks,
}: DailyGoalCardProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader>
          <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
            <CardTitle>Target Harian</CardTitle>
            <ChevronDownIcon
              className={`size-5 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-4 lg:gap-5">
            <div className="flex items-end gap-2">
              <span className="font-heading text-4xl font-semibold">
                {readsToday}
              </span>
              <span className="pb-1 text-sm text-muted-foreground">
                / {minimumArticle} bacaan
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-secondary transition-[width] duration-700"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                <FlameIcon
                  className="size-4 text-secondary"
                  aria-hidden="true"
                />
                <span>Streak aktif</span>
              </div>
              <span className="font-heading text-sm font-semibold tabular-nums">
                {streaks} hari
              </span>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
