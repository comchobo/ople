"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { AccountDialog, LoginDialog } from "./auth-dialogs";
import type { AuthAdapter } from "./auth-types";
import { SiteHeader } from "./site-header";
import { restoreTemporaryUser, temporaryAuth } from "./temporary-auth";

const ShellContext = createContext<{ start: () => void } | null>(null);

export function useAppShell() {
  const context = useContext(ShellContext);
  if (!context) throw new Error("AppShell is required");
  return context;
}

export function AppShell({
  children,
  auth = temporaryAuth,
}: {
  children: ReactNode;
  auth?: AuthAdapter;
}) {
  const temporary = auth === temporaryAuth;
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(auth.user);
  const [dialog, setDialog] = useState<"login" | "account" | null>(null);
  const [loginError, setLoginError] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setUser(temporary ? restoreTemporaryUser() : auth.user);
  }, [auth.user, temporary]);
  useEffect(() => {
    if (!pathname) return;
    document
      .querySelector<HTMLElement>("main h1")
      ?.focus({ preventScroll: true });
  }, [pathname]);

  function goToPlanners() {
    setDialog(null);
    router.push("/planners");
  }

  function openLogin() {
    setLoginError(false);
    setDialog("login");
  }

  async function login() {
    if (!auth.login || loggingIn) return;
    setLoggingIn(true);
    setLoginError(false);
    try {
      setUser(await auth.login());
      goToPlanners();
    } catch {
      setLoginError(true);
    } finally {
      setLoggingIn(false);
    }
  }

  function start() {
    if (user) goToPlanners();
    else openLogin();
  }

  async function logout() {
    if (!auth.logout || loggingOut) return;
    setLoggingOut(true);
    setLogoutError(false);
    try {
      await auth.logout();
      setUser(null);
      setDialog(null);
      router.push("/");
    } catch {
      setLogoutError(true);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <ShellContext value={{ start }}>
      <div className="app-frame m-auto flex h-[min(100dvh,834px)] w-[min(100%,1194px)] flex-col overflow-hidden border border-[#d4d4d4] bg-white">
        <SiteHeader
          user={user}
          onLogin={openLogin}
          onAccount={() => {
            setLogoutError(false);
            setDialog("account");
          }}
        />
        <main
          id="main"
          className={`min-h-0 flex-1 [scrollbar-color:#aaa_#f3f3f3] [scrollbar-width:thin] ${pathname === "/" ? "overflow-hidden p-0" : "overflow-auto p-7"}`}
        >
          {children}
        </main>
      </div>
      {dialog === "login" && (
        <LoginDialog
          onClose={() => setDialog(null)}
          onLogin={auth.login ? login : undefined}
          loggingIn={loggingIn}
          loginError={loginError}
          temporary={temporary}
        />
      )}
      {dialog === "account" && user && (
        <AccountDialog
          user={user}
          onClose={() => setDialog(null)}
          onPlanners={goToPlanners}
          onLogout={auth.logout ? logout : undefined}
          loggingOut={loggingOut}
          logoutError={logoutError}
        />
      )}
    </ShellContext>
  );
}
