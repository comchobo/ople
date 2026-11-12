import { UserRound } from "lucide-react";
import Link from "next/link";
import type { AuthUser } from "../lib/auth";

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
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Ople 제품 소개">
        Ople
      </Link>
      <nav className="header-links" aria-label="공통 탐색">
        {user ? (
          <>
            <Link className="text-button" href="/planners">
              내 플래너
            </Link>
            <button
              type="button"
              className="icon-button"
              aria-label="내 계정"
              title="내 계정"
              onClick={onAccount}
            >
              <UserRound size={22} aria-hidden="true" />
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
