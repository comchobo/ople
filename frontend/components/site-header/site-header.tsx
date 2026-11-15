"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  logoutPreviewAccount,
  readPreviewAccount,
} from "../account-preview/preview-account";
import Modal from "../modal/modal";

export default function SiteHeader() {
  const [account, setAccount] =
    useState<Awaited<ReturnType<typeof readPreviewAccount>>>(null);
  const [accountOpener, setAccountOpener] = useState<HTMLButtonElement | null>(
    null,
  );
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const loginButton = useRef<HTMLButtonElement>(null);
  const focusLogin = useRef(false);
  const [loginOpener, setLoginOpener] = useState<HTMLButtonElement | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();
    readPreviewAccount(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          if (value) setLoginOpener(null);
          setAccount(value);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setAccount(null);
      });
    return () => controller.abort();
  }, []);

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
      setAccount(null);
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
              <Link
                href="/planners"
                className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold focus-visible:outline-2"
              >
                내 플래너
              </Link>
              <button
                type="button"
                aria-haspopup="dialog"
                className="min-h-11 rounded-md px-3 text-sm font-semibold focus-visible:outline-2"
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
              className="min-h-11 cursor-pointer rounded-[3px] border border-transparent p-2 text-[13px] leading-[1.4] underline underline-offset-4 hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#222]"
              onClick={(event) => setLoginOpener(event.currentTarget)}
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
      {loginOpener && (
        <Modal
          title="로그인"
          opener={loginOpener}
          onDismiss={() => setLoginOpener(null)}
        >
          <a
            href="/api/auth/login"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[3px] border border-[#222] bg-[#222] px-3.5 py-[9px] text-center text-[15px] leading-[1.4] text-white hover:border-[#999] hover:bg-[#444] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#222]"
          >
            Google로 계속하기
          </a>
        </Modal>
      )}
    </header>
  );
}
