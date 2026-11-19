"use client";

import { useEffect, useState } from "react";
import type { Job, Planner } from "@/api/core";
import { useRequireAuth } from "@/hooks/auth/use-require-auth";
import { useGenerationJobs } from "@/hooks/planner/use-generation-jobs";
import { usePlanners } from "@/hooks/planner/use-planners";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { GenerationNotices } from "./generation-notices";
import { PlannerList } from "./planner-list";
import { PlannerNameEditor } from "./planner-name-editor";

export function PlannersScreen() {
  const { user, loading: authLoading } = useRequireAuth();
  const {
    planners,
    loading: plannersLoading,
    error: plannersError,
    refresh: refreshPlanners,
    change,
    remove,
  } = usePlanners(user);
  const {
    jobs,
    loading: jobsLoading,
    error: jobsError,
    setError,
    retryGeneration,
  } = useGenerationJobs(user, { poll: true, onPoll: refreshPlanners });
  const loading = plannersLoading || jobsLoading;
  const error = plannersError || jobsError;
  const move = useAppNavigation();
  const [rename, setRename] = useState<Planner | null>(null);
  useEffect(() => {
    if (!user) setRename(null);
  }, [user]);
  async function retry(job: Job) {
    try {
      const result = await retryGeneration(job.id);
      if (result?.status === "completed" && result.planner_id)
        await move(
          `/planners/${encodeURIComponent(result.planner_id)}`,
          false,
          true,
        );
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  return (
    <>
      <main className="planners">
        {authLoading || loading ? (
          <p>불러오는 중…</p>
        ) : (
          <>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="planner-heading">
              <div>
                <h1>내 플래너</h1>
                <p>여러 가능성을 만들고, 다시 꺼내보세요.</p>
              </div>
              <button
                type="button"
                className="primary"
                onClick={() => void move("/planners/new")}
              >
                새 플래너 만들기
              </button>
            </div>
            <p className="planner-count">플래너 {planners.length}개</p>
            <GenerationNotices jobs={jobs} retry={retry} />
            <PlannerList
              planners={planners}
              open={(id) => void move(`/planners/${encodeURIComponent(id)}`)}
              rename={setRename}
              remove={remove}
            />
            <footer className="site-footer">
              <span>플래너는 계정에 저장됩니다.</span>
              <button
                type="button"
                className="text-button"
                onClick={() => window.dispatchEvent(new Event("ople:logout"))}
              >
                로그아웃
              </button>
            </footer>
          </>
        )}
      </main>
      {rename && (
        <PlannerNameEditor
          planner={rename}
          close={() => setRename(null)}
          save={(value) => {
            change(value);
            setRename(null);
          }}
        />
      )}
    </>
  );
}
