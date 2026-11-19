"use client";

import { CircleUserRound } from "lucide-react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { AccountDialog } from "@/components/auth/account-dialog";
import { Auth } from "@/components/auth/auth";
import { useAccountActions } from "@/hooks/auth/use-account-actions";
import { useAppNavigation } from "@/hooks/use-app-navigation";

export function SiteHeader() {
  const { user, loading, auth, setAuth, account, setAccount, error, loggedIn } =
    useAccountActions();
  const navigate = useAppNavigation();
  function followIntro(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    void navigate(`${event.currentTarget.pathname}${event.currentTarget.hash}`);
  }
  return (
    <>
      <header className="site-header">
        <a
          href="/"
          className="brand"
          onClick={(event) => {
            event.preventDefault();
            void navigate("/");
          }}
        >
          Ople
        </a>
        <nav className="header-links" aria-label="계정 메뉴">
          <Link href="/#possibilities" onClick={followIntro}>
            세 가지 삶의 가능성
          </Link>
          <Link href="/#method" onClick={followIntro}>
            이용 방법
          </Link>
          {user ? (
            <>
              <button
                type="button"
                className="text-button"
                onClick={() => void navigate("/planners")}
              >
                내 플래너
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="계정"
                onClick={() => setAccount(true)}
              >
                <CircleUserRound />
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => setAuth(true)}
            >
              로그인
            </button>
          )}
        </nav>
      </header>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {auth && <Auth close={() => setAuth(false)} loggedIn={loggedIn} />}
      {account && user && (
        <AccountDialog user={user} close={() => setAccount(false)} />
      )}
    </>
  );
}
