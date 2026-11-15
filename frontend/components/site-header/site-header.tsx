"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutPreviewAccount } from "../account-preview/preview-account";
import Modal from "../modal/modal";
import { useSiteSession } from "./site-session";

const navigationActionClass =
  "inline-flex min-h-11 cursor-pointer items-center rounded-[3px] border border-transparent p-2 text-[13px] leading-[1.4] underline underline-offset-4 hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#222]";

export default function SiteHeader() {
  const { account, clearAccount, openLogin } = useSiteSession();
  const [accountOpener, setAccountOpener] = useState<HTMLButtonElement | null>(
    null,
  );
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const loginButton = useRef<HTMLButtonElement>(null);
  const focusLogin = useRef(false);

  useEffect(() => {
    if (!account && focusLogin.current) {
      focusLogin.current = false;
      loginButton.current?.focus({ preventScroll: true });
    }
  }, [account]);

  async function logout() {
    if (!account || loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      await logoutPreviewAccount(account.csrf_token);
      focusLogin.current = true;
      setAccountOpener(null);
      clearAccount();
    } catch {
      setLogoutError("로그아웃하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-neutral-300">
      <div className="mx-auto flex min-h-14 w-full max-w-[74.625rem] items-center justify-between gap-4 px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Ople 제품 소개"
          className="text-lg font-bold text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Ople
        </Link>

        <nav aria-label="공통 탐색" className="flex items-center gap-2">
          {account ? (
            <>
              <Link href="/planners" className={navigationActionClass}>
                내 플래너
              </Link>
              <button
                type="button"
                aria-haspopup="dialog"
                className={navigationActionClass}
                onClick={(event) => setAccountOpener(event.currentTarget)}
              >
                내 계정
              </button>
            </>
          ) : (
            <button
              ref={loginButton}
              type="button"
              aria-haspopup="dialog"
              className={navigationActionClass}
              onClick={(event) => openLogin(event.currentTarget)}
            >
              로그인
            </button>
          )}
        </nav>
      </div>
      {account && accountOpener && (
        <Modal
          title="내 계정"
          opener={accountOpener}
          onDismiss={() => setAccountOpener(null)}
        >
          <p className="font-semibold">{account.name}</p>
          <p className="mt-1 break-all text-sm text-neutral-600">
            {account.email}
          </p>
          {logoutError && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {logoutError}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/planners"
              onNavigate={() => setAccountOpener(null)}
              className="inline-flex min-h-11 items-center rounded-md border border-neutral-300 px-3 text-sm font-semibold focus-visible:outline-2"
            >
              내 플래너 보기
            </Link>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm font-semibold focus-visible:outline-2 disabled:opacity-50"
            >
              {loggingOut ? "로그아웃 중…" : "로그아웃"}
            </button>
          </div>
        </Modal>
      )}
    </header>
  );
}
