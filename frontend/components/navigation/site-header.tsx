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
      <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-[#d4d4d4] px-7">
        <a
          href="/"
          className="text-[24px] tracking-[-1px] [font-weight:750] no-underline focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px]"
          onClick={(event) => {
            event.preventDefault();
            void navigate("/");
          }}
        >
          Ople
        </a>
        <nav
          className="flex items-center gap-1 text-[13px]"
          aria-label="계정 메뉴"
        >
          {user ? (
            <>
              <button
                type="button"
                className="min-h-11 cursor-pointer rounded-[3px] border border-transparent bg-transparent p-2 leading-[1.4] underline underline-offset-4 hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
                onClick={() => void navigate("/planners")}
              >
                내 플래너
              </button>
              <button
                type="button"
                className="inline-grid min-h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-[3px] border border-[#d4d4d4] bg-white p-0 leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
                aria-label="계정"
                onClick={() => setAccount(true)}
              >
                <CircleUserRound className="size-[15px]" />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
              disabled={loading}
              onClick={() => setAuth(true)}
            >
              로그인
            </button>
          )}
        </nav>
      </header>
      {error && (
        <p role="alert" className="border border-[#555] bg-[#f0f0f0] p-3.5">
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
