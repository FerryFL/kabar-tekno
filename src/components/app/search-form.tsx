"use client";

import { SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchFormProps {
  q: string;
  placeholder?: string;
}

export function SearchForm({ q, placeholder = "Cari sumber, judul, atau ringkasan" }: SearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(q);
  const [prevQ, setPrevQ] = useState(q);

  if (q !== prevQ) {
    setPrevQ(q);
    setValue(q);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextValue = value.trim();
    const params = new URLSearchParams(searchParams.toString());

    if (nextValue) params.set("q", nextValue);
    else params.delete("q");

    params.delete("today");
    params.delete("yesterday");
    params.delete("previous");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <form className="flex w-full gap-2" onSubmit={handleSubmit}>
      <Input
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="font-mono"
      />
      <Button type="submit" variant="secondary">
        <SearchIcon data-icon="inline-start" />
        Cari
      </Button>
    </form>
  );
}
