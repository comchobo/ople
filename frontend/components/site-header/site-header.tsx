"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readPreviewAccount } from "../account-preview/preview-account";
import Modal from "../modal/modal";

export default function SiteHeader({ isSignedIn }: { isSignedIn: boolean }) {
  const [hasSession, setHasSession] = useState(isSignedIn);
  const [loginOpener, setLoginOpener] = useState<HTMLButtonElement | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();
    readPreviewAccount(controller.signal)
      .then((account) => {
        if (!controller.signal.aborted) setHasSession(account !== null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setHasSession(false);
      });
    return () => controller.abort();
  }, []);

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
          {hasSession ? (
            <>
              <Link
                href="/planners"
                className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold focus-visible:outline-2"
              >
                내 플래너
              </Link>
              <Link
                href="/tmp/preview/implementation"
                className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold focus-visible:outline-2"
              >
                내 계정
              </Link>
            </>
          ) : (
            <button
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
