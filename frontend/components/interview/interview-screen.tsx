"use client";

import { useState } from "react";
import { Notice } from "@/components/notice";
import { useRequireAuth } from "@/hooks/auth/use-require-auth";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { Interview } from "./interview";

export function InterviewScreen() {
  const { loading } = useRequireAuth();
  const move = useAppNavigation();
  const [error, setError] = useState("");
  return (
    <main className="flex-1">
      <div className="page-shell py-8 md:py-12">
        {loading ? (
          <p className="py-24 text-center text-sm text-muted">불러오는 중…</p>
        ) : (
          <>
            {error && (
              <div className="mb-5">
                <Notice tone="error">{error}</Notice>
              </div>
            )}
            <Interview
              exit={() => void move("/planners")}
              generated={(job) => {
                const path =
                  job.status === "completed" && job.planner_id
                    ? `/planners/${encodeURIComponent(job.planner_id)}`
                    : "/planners";
                void move(path, false, true).catch((cause: Error) =>
                  setError(cause.message),
                );
              }}
            />
          </>
        )}
      </div>
    </main>
  );
}
