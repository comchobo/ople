"use client";

import { CircleUserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Auth } from "./auth";
import { Modal } from "./modal";
import { confirmLeave, useAppNavigation } from "./navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, loggedIn, logout } = useAuth();
  const navigate = useAppNavigation();
  const path = usePathname();
  const view =
    path === "/"
      ? "intro"
      : path === "/planners/new"
        ? "interview"
        : path === "/planners"
          ? "planners"
          : "board";
  const [auth, setAuth] = useState(false);
  const [account, setAccount] = useState(false);
  const [error, setError] = useState("");
  useLayoutEffect(() => {
    function login() {
      setAuth(true);
    }
    async function signOut() {
      if (!confirmLeave()) return;
      try {
        await logout();
        setAccount(false);
        await navigate("/", true, true);
      } catch (cause) {
        setError((cause as Error).message);
      }
    }
    window.addEventListener("ople:login", login);
    window.addEventListener("ople:logout", signOut);
    if (new URLSearchParams(window.location.search).has("auth_error")) {
      setError("Google 로그인에 실패했습니다. 다시 시도해주세요.");
      window.history.replaceState(window.history.state, "", "/");
    }
    return () => {
      window.removeEventListener("ople:login", login);
      window.removeEventListener("ople:logout", signOut);
    };
  }, [logout, navigate]);
  if (path === "/privacy" || path === "/terms") return <>{children}</>;
  return (
    <div id="app" className={view}>
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
      {children}
      {auth && (
        <Auth
          close={() => setAuth(false)}
          loggedIn={(value) => {
            loggedIn(value);
            setAuth(false);
            void navigate("/", true, true);
          }}
        />
      )}
      {account && user && (
        <Modal title="내 계정" close={() => setAccount(false)}>
          <div className="account-info">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
          <div className="account-menu">
            <button
              type="button"
              onClick={() => {
                void navigate("/planners").then((moved) => {
                  if (moved) setAccount(false);
                });
              }}
            >
              내 플래너
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("ople:logout"))}
            >
              로그아웃
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
