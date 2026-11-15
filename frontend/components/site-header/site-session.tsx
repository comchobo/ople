"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { readPreviewAccount } from "../account-preview/preview-account";
import Modal from "../modal/modal";

type Account = Awaited<ReturnType<typeof readPreviewAccount>>;

const SiteSession = createContext<{
  account: Account;
  checkingAccount: boolean;
  clearAccount: () => void;
  openLogin: (opener: HTMLButtonElement) => void;
} | null>(null);

export function useSiteSession() {
  const session = useContext(SiteSession);
  if (!session) throw new Error("SiteSessionProvider is required.");
  return session;
}

export function SiteSessionProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account>(null);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [loginOpener, setLoginOpener] = useState<HTMLButtonElement | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();
    readPreviewAccount(controller.signal)
      .then((value) => {
        if (controller.signal.aborted) return;
        if (value) setLoginOpener(null);
        setAccount(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setAccount(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setCheckingAccount(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <SiteSession.Provider
      value={{
        account,
        checkingAccount,
        clearAccount: () => setAccount(null),
        openLogin: setLoginOpener,
      }}
    >
      {children}
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
    </SiteSession.Provider>
  );
}
