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
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-[#d4d4d4] px-7 py-2 text-[13px] text-[#666]">
      <span>Ople · 오디세이 플래너</span>
      <nav className="flex flex-wrap gap-x-5" aria-label="서비스 정책">
        <a
          className="inline-flex min-h-11 items-center focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px]"
          href="/privacy"
          onClick={followPolicy}
        >
          개인정보처리방침
        </a>
        <a
          className="inline-flex min-h-11 items-center focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px]"
          href="/terms"
          onClick={followPolicy}
        >
          서비스 약관
        </a>
      </nav>
    </footer>
  );
}
