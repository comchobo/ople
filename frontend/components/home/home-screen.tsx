"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/use-auth";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { Intro } from "./intro";

export function HomeScreen() {
  const { user, loading } = useAuth();
  const move = useAppNavigation();
  const [pending, setPending] = useState(false);
  const proceed = useCallback(() => {
    if (user) void move("/planners");
    else window.dispatchEvent(new Event("ople:login"));
  }, [user, move]);
  useEffect(() => {
    if (!pending || loading) return;
    setPending(false);
    proceed();
  }, [pending, loading, proceed]);
  return (
    <main className="intro">
      <Intro
        start={() => {
          if (loading) setPending(true);
          else proceed();
        }}
      />
    </main>
  );
}
