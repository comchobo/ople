"use client";

import { useEffect, useRef } from "react";
import { useAppNavigation } from "./use-app-navigation";
import { useAuth } from "./use-auth";

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const move = useAppNavigation();
  const authenticated = useRef(false);
  useEffect(() => {
    if (loading) return;
    if (user) authenticated.current = true;
    else {
      if (!authenticated.current) window.dispatchEvent(new Event("ople:login"));
      void move("/", true, true);
    }
  }, [user, loading, move]);
  return { user, loading: loading || !user };
}
