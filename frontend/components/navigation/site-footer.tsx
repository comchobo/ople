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
    <footer className="site-policy-footer">
      <span>Ople · 오디세이 플래너</span>
      <nav aria-label="서비스 정책">
        <a href="/privacy" onClick={followPolicy}>
          개인정보처리방침
        </a>
        <a href="/terms" onClick={followPolicy}>
          서비스 약관
        </a>
      </nav>
    </footer>
  );
}
