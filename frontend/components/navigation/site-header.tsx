"use client";

import { CircleUserRound } from "lucide-react";
import { AccountDialog } from "@/components/auth/account-dialog";
import { Auth } from "@/components/auth/auth";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { useAccountActions } from "@/hooks/auth/use-account-actions";
import { useAppNavigation } from "@/hooks/use-app-navigation";

export function SiteHeader() {
  const { user, loading, auth, setAuth, account, setAccount, error, loggedIn } =
    useAccountActions();
  const navigate = useAppNavigation();
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-rule bg-paper">
        <div className="page-shell flex h-[76px] items-center justify-between gap-6 md:h-[88px]">
          <div className="flex min-w-0 items-baseline gap-4">
            <a
              href="/"
              className="inline-flex min-h-11 items-center text-[26px] font-extrabold tracking-[-0.04em] no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink md:text-[30px]"
              onClick={(event) => {
                event.preventDefault();
                void navigate("/");
              }}
            >
              Ople
            </a>
            <span className="folio hidden text-[10px] lg:inline">
              Odyssey Planning · Vol. 01
            </span>
          </div>
          <nav
            className="flex shrink-0 items-center gap-1 text-[13px]"
            aria-label="계정 메뉴"
          >
            {user ? (
              <>
                <Button
                  variant="quiet"
                  className="px-3"
                  onClick={() => void navigate("/planners")}
                >
                  내 플래너
                </Button>
                <Button
                  variant="icon"
                  aria-label="계정"
                  onClick={() => setAccount(true)}
                >
                  <CircleUserRound className="size-[18px]" />
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                disabled={loading}
                onClick={() => setAuth(true)}
              >
                로그인
              </Button>
            )}
          </nav>
        </div>
      </header>
      {error && (
        <div className="page-shell py-3">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {auth && <Auth close={() => setAuth(false)} loggedIn={loggedIn} />}
      {account && user && (
        <AccountDialog user={user} close={() => setAccount(false)} />
      )}
    </>
  );
}
