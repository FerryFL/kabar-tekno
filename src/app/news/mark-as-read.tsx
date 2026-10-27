"use client";

import { useEffect, useRef } from "react";

import { useToastManager } from "@/components/ui/toast";
import { markNewsRead } from "@/features/news/actions";

export function MarkAsRead({ newsId }: { newsId: string }) {
  const firedRef = useRef(false);
  const toastManager = useToastManager();
  const toastManagerRef = useRef(toastManager);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    void markNewsRead(newsId).catch((error) => {
      console.error("Mark news as read failed", { newsId, error });
      toastManagerRef.current.add({
        type: "error",
        title: "Gagal menyimpan status baca",
        description: "Silakan coba lagi.",
      });
    });
  }, [newsId]);

  return null;
}
