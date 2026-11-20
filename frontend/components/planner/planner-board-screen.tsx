"use client";

import { useEffect } from "react";
import { useRequireAuth } from "@/hooks/auth/use-require-auth";
import { usePlanners } from "@/hooks/planner/use-planners";
import { useAppNavigation } from "@/hooks/use-app-navigation";
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
    <main className="flex-1">
      <div className="page-shell py-8 md:py-12">
        {authLoading || loading ? (
          <p className="py-24 text-center text-sm text-muted">불러오는 중…</p>
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
      </div>
    </main>
  );
}
