"use client";

import { useEffect, useState } from "react";
import type { Job, Planner } from "@/api/core";
import { useRequireAuth } from "@/hooks/auth/use-require-auth";
import { usePlanners } from "@/hooks/planner/use-planners";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { GenerationNotices } from "./generation-notices";
import { PlannerList } from "./planner-list";
import { PlannerNameEditor } from "./planner-name-editor";

export function PlannersScreen() {
  const { user, loading: authLoading } = useRequireAuth();
  const {
    planners,
    jobs,
    loading,
    error,
    setError,
    retryGeneration,
    change,
    remove,
  } = usePlanners(user, true);
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
      <main className="min-h-0 flex-1 [scrollbar-color:#aaa_#f3f3f3] [scrollbar-width:thin] flex flex-col overflow-hidden p-7">
        {authLoading || loading ? (
          <p>불러오는 중…</p>
        ) : (
          <>
            {error && (
              <p
                role="alert"
                className="border border-[#555] bg-[#f0f0f0] p-3.5"
              >
                {error}
              </p>
            )}
            <div className="mb-7 flex shrink-0 items-center justify-between gap-6">
              <div>
                <h1 className="text-[30px] leading-[1.35] tracking-[-1px] [font-weight:650] text-balance">
                  내 플래너
                </h1>
                <p className="mt-2 text-[#666]">
                  여러 가능성을 만들고, 다시 꺼내보세요.
                </p>
              </div>
              <button
                type="button"
                className="min-h-11 cursor-pointer rounded-[3px] border border-[#222] bg-[#222] px-3.5 py-[9px] leading-[1.4] text-white hover:border-[#999] hover:bg-[#444] hover:text-white focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
                onClick={() => void move("/planners/new")}
              >
                새 플래너 만들기
              </button>
            </div>
            <p className="shrink-0 pb-3 text-[13px] text-[#666]">
              플래너 {planners.length}개
            </p>
            <GenerationNotices jobs={jobs} retry={retry} />
            <PlannerList
              planners={planners}
              open={(id) => void move(`/planners/${encodeURIComponent(id)}`)}
              rename={setRename}
              remove={remove}
            />
            <footer className="flex shrink-0 items-center justify-between border-t border-[#d4d4d4] py-3 text-[13px] text-[#666]">
              <span>플래너는 계정에 저장됩니다.</span>
              <button
                type="button"
                className="min-h-11 cursor-pointer rounded-[3px] border border-transparent bg-transparent p-2 leading-[1.4] underline underline-offset-4 hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
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
