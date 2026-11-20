"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { Job, Planner } from "@/api/core";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
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
      <main className="flex-1">
        <div className="page-shell py-10 md:py-14">
          {authLoading || loading ? (
            <p className="py-24 text-center text-sm text-muted">불러오는 중…</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink pb-3">
                <span className="folio">My planners · Vol. 01</span>
                <span className="folio">플래너 {planners.length}개</span>
              </div>
              {error && (
                <div className="pt-5">
                  <Notice tone="error">{error}</Notice>
                </div>
              )}
              <div className="flex flex-col gap-6 pt-7 pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-title font-extrabold">내 플래너</h1>
                  <p className="mt-3 max-w-[30em] text-[15px] leading-relaxed text-muted">
                    여러 가능성을 만들고, 다시 꺼내보세요.
                  </p>
                </div>
                <Button
                  variant="primary"
                  className="self-start px-5 md:self-auto"
                  onClick={() => void move("/planners/new")}
                >
                  새 플래너 만들기
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              </div>
              <GenerationNotices jobs={jobs} retry={retry} />
              <PlannerList
                planners={planners}
                open={(id) => void move(`/planners/${encodeURIComponent(id)}`)}
                rename={setRename}
                remove={remove}
              />
              <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-4 text-[12px] text-muted">
                <span>플래너는 계정에 저장됩니다.</span>
                <Button
                  variant="quiet"
                  className="px-0 text-[12px]"
                  onClick={() => window.dispatchEvent(new Event("ople:logout"))}
                >
                  로그아웃
                </Button>
              </footer>
            </>
          )}
        </div>
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
