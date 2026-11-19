"use client";

import { useAuth } from "@/hooks/auth/use-auth";
import { useAppNavigation } from "@/hooks/navigation/use-app-navigation";
import { Intro } from "./intro";

export function HomeScreen() {
  const { user, loading } = useAuth();
  const move = useAppNavigation();
  return (
    <main>
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
