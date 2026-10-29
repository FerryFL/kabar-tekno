"use client";

import { SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (q !== prevQ) {
    setPrevQ(q);
    setValue(q);
  }

  const updateSearch = useCallback((nextValue: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextValue) params.set("q", nextValue);
    else params.delete("q");

    params.delete("today");
    params.delete("yesterday");
    params.delete("previous");

    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    const currentQuery = searchParams.toString();
    const currentHref = currentQuery ? `${pathname}?${currentQuery}` : pathname;

    if (href !== currentHref) {
      router.replace(href, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [q]);

  function handleChange(nextValue: string) {
    setValue(nextValue);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
      updateSearch(nextValue.trim());
    }, 400);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = null;
    updateSearch(value.trim());
  }

  return (
    <form className="flex w-full gap-2" onSubmit={handleSubmit}>
      <Input
        name="q"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        className="font-mono text-xs md:text-base"
      />
      <Button type="submit" variant="secondary">
        <SearchIcon data-icon="inline-start" />
        Cari
      </Button>
    </form>
  );
}
