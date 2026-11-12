"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { type AuthAdapter, anonymousAuth } from "../lib/auth";
import { AccountDialog, LoginDialog } from "./auth-dialogs";
import { SiteHeader } from "./site-header";

const ShellContext = createContext<{ start: () => void } | null>(null);

export function useAppShell() {
  const context = useContext(ShellContext);
  if (!context) throw new Error("AppShell is required");
  return context;
}

export function AppShell({
  children,
  auth = anonymousAuth,
}: {
  children: ReactNode;
  auth?: AuthAdapter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(auth.user);
  const [dialog, setDialog] = useState<"login" | "account" | null>(null);
  const [logoutError, setLogoutError] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setUser(auth.user);
  }, [auth.user]);
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

  function start() {
    if (user) goToPlanners();
    else setDialog("login");
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
      <div className={pathname === "/" ? "app-frame intro" : "app-frame"}>
        <SiteHeader
          user={user}
          onLogin={() => setDialog("login")}
          onAccount={() => {
            setLogoutError(false);
            setDialog("account");
          }}
        />
        <main id="main">{children}</main>
      </div>
      {dialog === "login" && <LoginDialog onClose={() => setDialog(null)} />}
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
