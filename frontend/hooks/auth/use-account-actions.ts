"use client";

import { useLayoutEffect, useState } from "react";
import type { User } from "@/api/core";
import { confirmLeave, useAppNavigation } from "@/hooks/use-app-navigation";
import { useAuth } from "./use-auth";

export function useAccountActions() {
  const { user, loading, loggedIn, logout } = useAuth();
  const navigate = useAppNavigation();
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

  return {
    user,
    loading,
    auth,
    setAuth,
    account,
    setAccount,
    error,
    loggedIn(value: User) {
      loggedIn(value);
      setAuth(false);
      void navigate("/", true, true);
    },
  };
}
