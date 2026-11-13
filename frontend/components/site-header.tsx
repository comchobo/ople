import { UserRound } from "lucide-react";
import Link from "next/link";
import type { AuthUser } from "./auth-types";
import { focusClass, iconButtonClass, textButtonClass } from "./ui-styles";

export function SiteHeader({
  user,
  onLogin,
  onAccount,
}: {
  user: AuthUser | null;
  onLogin: () => void;
  onAccount: () => void;
}) {
  return (
    <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-[#d4d4d4] px-7">
      <h2>
        <Link
          className={`block text-[24px] font-[750] tracking-[-1px] no-underline ${focusClass}`}
          href="/"
          aria-label="Ople 제품 소개"
        >
          Ople
        </Link>
      </h2>
      <nav
        className="flex items-center gap-1 text-[13px]"
        aria-label="공통 탐색"
      >
        {user ? (
          <>
            <Link
              className={`inline-flex min-h-11 items-center p-2 underline ${focusClass}`}
              href="/planners"
            >
              내 플래너
            </Link>
            <button
              type="button"
              className={iconButtonClass}
              aria-label="내 계정"
              title="내 계정"
              onClick={onAccount}
            >
              <UserRound size={22} aria-hidden="true" />
            </button>
          </>
        ) : (
          <button type="button" className={textButtonClass} onClick={onLogin}>
            로그인
          </button>
        )}
      </nav>
    </header>
  );
}
