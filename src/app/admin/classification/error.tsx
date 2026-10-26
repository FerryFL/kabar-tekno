"use client";

import { useEffect, useRef } from "react";

import { useToastManager } from "@/components/ui/toast";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const toastManager = useToastManager();
  const toastManagerRef = useRef(toastManager);

  useEffect(() => {
    console.error("Classification page error", error);
    toastManagerRef.current.add({
      type: "error",
      title: "Klasifikasi gagal dimuat",
      description: "Silakan coba lagi.",
    });
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
      <h2 className="text-lg font-semibold">Klasifikasi tidak dapat dimuat</h2>
      <p className="text-sm text-muted-foreground">Silakan coba lagi.</p>
      <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => reset()}>
        Coba lagi
      </button>
    </main>
  );
}
