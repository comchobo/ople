"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useRef,
  useState,
} from "react";
import AccountModal from "./AccountModal";
import Header from "./Header";
import LoginModal from "./LoginModal";

type StartActions = {
  isLoggedIn: boolean;
  onLogin: () => void;
  onNavigate: (page: "planners") => void;
};

const StartActionsContext = createContext<StartActions | null>(null);

export function useStartActions() {
  const actions = useContext(StartActionsContext);
  if (!actions) {
    throw new Error("시작하기는 AppShell 안에서 사용해야 합니다.");
  }
  return actions;
}

export default function AppShell({
  children,
  isLoggedIn = false,
}: {
  children: ReactNode;
  isLoggedIn?: boolean;
}) {
  const router = useRouter();
  const loginDialog = useRef<HTMLDialogElement>(null);
  const accountDialog = useRef<HTMLDialogElement>(null);
  const [previewLoggedIn, setPreviewLoggedIn] = useState<boolean | null>(null);
  const isDevelopment = process.env.NODE_ENV === "development";
  const displayedLoggedIn = isDevelopment
    ? (previewLoggedIn ?? isLoggedIn)
    : isLoggedIn;

  function onLogin() {
    loginDialog.current?.showModal();
  }

  function onNavigate(page: "planners") {
    if (accountDialog.current?.open) {
      accountDialog.current.close();
    }
    router.push(`/${page}`);
  }

  function toggleLoginPreview() {
    loginDialog.current?.close();
    accountDialog.current?.close();
    setPreviewLoggedIn(!displayedLoggedIn);
  }

  const actions = { isLoggedIn: displayedLoggedIn, onLogin, onNavigate };

  return (
    <StartActionsContext.Provider value={actions}>
      <div className="app-shell">
        {isDevelopment && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-b border-(--line) bg-(--soft) px-7 py-2 text-[12px]">
            <span>개발용 화면 미리보기 · 실제 인증 아님</span>
            <button
              type="button"
              aria-label="로그인 상태 미리보기"
              aria-pressed={displayedLoggedIn}
              onClick={toggleLoginPreview}
            >
              {displayedLoggedIn
                ? "비로그인 상태로 보기"
                : "로그인 상태로 보기"}
            </button>
          </div>
        )}
        <Header
          {...actions}
          onAccount={() => accountDialog.current?.showModal()}
        />
        {children}
        <LoginModal dialogRef={loginDialog} />
        <AccountModal dialogRef={accountDialog} onNavigate={onNavigate} />
      </div>
    </StartActionsContext.Provider>
  );
}
