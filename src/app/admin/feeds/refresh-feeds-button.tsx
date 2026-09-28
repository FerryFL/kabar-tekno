"use client";

import { RefreshCcwIcon } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function RefreshFeedsButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      <RefreshCcwIcon data-icon="inline-start" />
      {pending ? "Refreshing..." : "Refresh"}
    </Button>
  );
}
