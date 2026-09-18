"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateGoal } from "@/features/goals/actions";

export function GoalForm({ initialMinimumArticle }: { initialMinimumArticle: number }) {
  const [minimumArticle, setMinimumArticle] = useState(String(initialMinimumArticle));

  return (
    <form action={updateGoal} className="flex gap-2">
      <Input
        type="number"
        name="minimumArticle"
        min={1}
        max={100}
        value={minimumArticle}
        onChange={(event) => setMinimumArticle(event.target.value)}
      />
      <Button type="submit">Ubah</Button>
    </form>
  );
}
