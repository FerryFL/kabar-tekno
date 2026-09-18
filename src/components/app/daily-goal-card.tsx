"use client";

import { ChevronDownIcon } from "lucide-react";
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
          <CardContent className="flex flex-col gap-2 lg:gap-3">
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
                className="h-full bg-secondary"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Streak berlangsung: {streaks} hari
            </p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
