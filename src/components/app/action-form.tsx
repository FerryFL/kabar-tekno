"use client";

import type { ComponentProps, ReactNode } from "react";
import { useActionState, useEffect, useRef } from "react";

import { useToastManager } from "@/components/ui/toast";

type ServerAction = (formData: FormData) => Promise<unknown>;

type ActionState = {
  error: string | null;
  requestId: number;
};

type ActionFormProps = Omit<ComponentProps<"form">, "action"> & {
  action: ServerAction;
  children: ReactNode;
};

export function ActionForm({ action, children, ...props }: ActionFormProps) {
  const toastManager = useToastManager();
  const toastManagerRef = useRef(toastManager);
  const [state, formAction] = useActionState<ActionState, FormData>(
    async (_previousState, formData) => {
      try {
        const result = await action(formData);
        if (
          typeof result === "object" &&
          result !== null &&
          "ok" in result &&
          result.ok === false
        ) {
          throw new Error(
            "message" in result && typeof result.message === "string"
              ? result.message
              : "Aksi gagal.",
          );
        }

        return { error: null, requestId: Date.now() };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Aksi gagal.",
          requestId: Date.now(),
        };
      }
    },
    { error: null, requestId: 0 },
  );

  useEffect(() => {
    if (!state.error) return;

    toastManagerRef.current.add({
      type: "error",
      title: "Aksi gagal",
      description: state.error,
    });
  }, [state.error, state.requestId]);

  return (
    <form action={formAction} {...props}>
      {children}
    </form>
  );
}
