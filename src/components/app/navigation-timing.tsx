"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationTiming() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigationStartedAt = useRef<number | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.origin !== window.location.origin) return;

      navigationStartedAt.current = performance.now();
      console.info("[client-timing] navigation.click", {
        href: link.href,
      });
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    if (navigationStartedAt.current === null) return;

    console.info("[client-timing] navigation.rendered", {
      pathname,
      search: searchParams.toString(),
      ms: Math.round(performance.now() - navigationStartedAt.current),
    });
    navigationStartedAt.current = null;
  }, [pathname, searchParams]);

  return null;
}
