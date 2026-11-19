"use client";

import { CircleUserRound } from "lucide-react";
import { AccountDialog } from "@/components/auth/account-dialog";
import { Auth } from "@/components/auth/auth";
import { useAccountActions } from "@/hooks/auth/use-account-actions";
import { useAppNavigation } from "@/hooks/use-app-navigation";

export function SiteHeader() {
  const { user, loading, auth, setAuth, account, setAccount, error, loggedIn } =
    useAccountActions();
  const navigate = useAppNavigation();
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
