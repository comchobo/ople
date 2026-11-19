"use client";

import { CircleUserRound } from "lucide-react";

export function SiteHeader({
  authenticated,
  loading,
  home,
  planners,
  login,
  account,
}: {
  authenticated: boolean;
  loading: boolean;
  home: () => void;
  planners: () => void;
  login: () => void;
  account: () => void;
}) {
  return (
    <header className="site-header">
      <a
        href="/"
        className="brand"
        onClick={(event) => {
          event.preventDefault();
          home();
        }}
      >
        Ople
      </a>
      <nav className="header-links" aria-label="계정 메뉴">
        {authenticated ? (
          <>
            <button type="button" className="text-button" onClick={planners}>
              내 플래너
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="계정"
              onClick={account}
            >
              <CircleUserRound />
            </button>
          </>
        ) : (
          <button type="button" disabled={loading} onClick={login}>
            로그인
          </button>
        )}
      </nav>
    </header>
  );
}
