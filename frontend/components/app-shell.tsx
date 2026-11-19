"use client";

import { CircleUserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useShellAuth } from "@/hooks/use-shell-auth";
import { AccountModal } from "./account-modal";
import { Auth } from "./auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    user,
    loading,
    navigate,
    auth,
    setAuth,
    account,
    setAccount,
    error,
    completeLogin,
  } = useShellAuth();
  const path = usePathname();
  const view =
    path === "/"
      ? "intro"
      : path === "/planners/new"
        ? "interview"
        : path === "/planners"
          ? "planners"
          : "board";
  if (path === "/privacy" || path === "/terms") return <>{children}</>;
  return (
    <div id="app" className={view}>
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
      {children}
      {auth && <Auth close={() => setAuth(false)} loggedIn={completeLogin} />}
      {account && user && (
        <AccountModal user={user} close={() => setAccount(false)} />
      )}
    </div>
  );
}
