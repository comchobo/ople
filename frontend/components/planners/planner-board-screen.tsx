"use client";

import { useEffect } from "react";
import { useRequireAuth } from "@/hooks/auth/use-require-auth";
import { useAppNavigation } from "@/hooks/navigation/use-app-navigation";
import { usePlanners } from "@/hooks/planners/use-planners";
import { Board } from "./board";

export function PlannerBoardScreen({ plannerId }: { plannerId: string }) {
  const { user, loading: authLoading } = useRequireAuth();
  const { planners, loading, error, change } = usePlanners(user);
  const move = useAppNavigation();
  const planner = planners.find((item) => item.id === plannerId);
  useEffect(() => {
    if (user && !loading && (error || !planner))
      void move("/planners", true, true);
  }, [user, loading, error, planner, move]);
  return (
    <main>
      {authLoading || loading ? (
        <p>불러오는 중…</p>
      ) : (
        planner && (
          <Board
            key={planner.id}
            planner={planner}
            change={change}
            list={() => void move("/planners")}
            create={() => void move("/planners/new")}
          />
        )
      )}
    </main>
  );
}
