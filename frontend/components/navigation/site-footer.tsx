"use client";

import type { MouseEvent } from "react";
import { useAppNavigation } from "@/hooks/use-app-navigation";

export function SiteFooter() {
  const navigate = useAppNavigation();
  function followPolicy(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    void navigate(event.currentTarget.pathname);
  }
  return (
    <footer className="mt-auto border-t border-rule">
      <div className="page-shell flex flex-col gap-3 py-5 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span>Ople · 오디세이 플래너</span>
          <span className="folio hidden text-[10px] md:inline">
            Vol. 01 · 2026–2031
          </span>
        </div>
        <nav className="flex flex-wrap gap-x-5" aria-label="서비스 정책">
          <a
            className="inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink"
            href="/privacy"
            onClick={followPolicy}
          >
            개인정보처리방침
          </a>
          <a
            className="inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink"
            href="/terms"
            onClick={followPolicy}
          >
            서비스 약관
          </a>
        </nav>
      </div>
    </footer>
  );
}
