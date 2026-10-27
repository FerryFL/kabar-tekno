"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Accordion } from "@/components/ui/accordion";

interface NewsSectionsAccordionProps {
  initiallyOpenSection?: string;
  children: ReactNode;
}

export function NewsSectionsAccordion({
  initiallyOpenSection,
  children,
}: NewsSectionsAccordionProps) {
  const [value, setValue] = useState<string[]>(
    initiallyOpenSection ? [initiallyOpenSection] : [],
  );

  return (
    <Accordion
      value={value}
      onValueChange={(nextValue) => setValue(nextValue)}
      multiple={false}
      className="flex flex-col gap-3"
    >
      {children}
    </Accordion>
  );
}
