"use client";

import { useEffect, useRef } from "react";

import { markNewsRead } from "@/features/news/actions";

export function MarkAsRead({ newsId }: { newsId: string }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    void markNewsRead(newsId);
  }, [newsId]);

  return null;
}
