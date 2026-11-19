"use client";

import { useAppNavigation } from "@/hooks/use-app-navigation";
import { useAuth } from "@/hooks/use-auth";
import { Intro } from "./intro";

export function HomeScreen() {
  const { user, loading } = useAuth();
  const move = useAppNavigation();
  return (
    <main className="intro">
      {loading ? (
        <p>불러오는 중…</p>
      ) : (
        <Intro
          start={() => {
            if (user) void move("/planners");
            else window.dispatchEvent(new Event("ople:login"));
          }}
        />
      )}
    </main>
  );
}
