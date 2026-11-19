"use client";

import { useState } from "react";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Interview } from "./interview";

export function InterviewScreen() {
  const { loading } = useRequireAuth();
  const move = useAppNavigation();
  const [error, setError] = useState("");
  return (
    <main className="interview">
      {loading ? (
        <p>불러오는 중…</p>
      ) : (
        <>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
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
    </main>
  );
}
