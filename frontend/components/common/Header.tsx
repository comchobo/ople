"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";

type HeaderProps = {
  isLoggedIn: boolean;
  onLogin?: () => void;
  onAccount?: () => void;
  onNavigate?: (page: "planners") => void;
};

export default function Header({
  isLoggedIn,
  onLogin,
  onAccount,
  onNavigate,
}: HeaderProps) {
  return (
    <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-(--line) px-7">
      <Link
        href="/"
        className="text-[24px] font-[750] tracking-[-1px] no-underline"
        aria-label="Ople 제품 소개"
      >
        Ople
      </Link>

      <nav className="flex items-center gap-1 text-[13px]" aria-label="공통 메뉴">
        {isLoggedIn ? (
          <>
            <button
              type="button"
              className="text-button"
              onClick={() => onNavigate?.("planners")}
            >
              내 플래너
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="계정"
              onClick={onAccount}
            >
              <UserRound size={15} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </>
        ) : (
          <button type="button" className="text-button" onClick={onLogin}>
            로그인
          </button>
        )}
      </nav>
    </header>
  );
}
