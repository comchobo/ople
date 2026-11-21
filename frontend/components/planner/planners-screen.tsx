"use client";

import { useEffect, useState } from "react";
import type { Job, Planner } from "@/api/core";
import { useRequireAuth } from "@/hooks/auth/use-require-auth";
import { useGenerationJobs } from "@/hooks/planner/use-generation-jobs";
import { usePlannerCopy } from "@/hooks/planner/use-planner-copy";
import { usePlanners } from "@/hooks/planner/use-planners";
import { useAppNavigation } from "@/hooks/use-app-navigation";
import { GenerationNotices } from "./generation-notices";
import { PlannerCopyNameDialog } from "./planner-copy-name-dialog";
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
    includeCopy,
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
  const copy = usePlannerCopy(user);
  const move = useAppNavigation();
  const [rename, setRename] = useState<Planner | null>(null);
  const [copyNameOpen, setCopyNameOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [newCopyId, setNewCopyId] = useState<string | null>(null);
  const userId = user?.id;
  useEffect(() => {
    if (userId === undefined) setRename(null);
    setCopyNameOpen(false);
    setNotice("");
    setNewCopyId(null);
  }, [userId]);
  useEffect(() => {
    if (copy.needsName) setCopyNameOpen(true);
    else if (copy.status === "failed") setCopyNameOpen(false);
  }, [copy.needsName, copy.status]);

  async function finishCopy(action: () => Promise<Planner | undefined>) {
    const result = await action();
    if (result && includeCopy(result)) {
      setCopyNameOpen(false);
      setNewCopyId(result.id);
      setNotice("플래너를 복제했습니다.");
    }
  }
  function startCopy(id: string) {
    setNotice("");
    setNewCopyId(null);
    void finishCopy(() => copy.start(id));
  }
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
  const source = planners.find((planner) => planner.id === copy.sourceId);
  return (
    <>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-7 [scrollbar-color:#aaa_#f3f3f3] [scrollbar-width:thin]">
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
            {notice && (
              <p
                className="mb-4 flex shrink-0 items-center justify-between gap-4 border border-[#d4d4d4] bg-[#f3f3f3] px-4 py-3 text-sm max-[600px]:flex-col max-[600px]:items-start"
                role="status"
              >
                {notice}
              </p>
            )}
            {copy.pending && (
              <p
                className="mb-4 flex shrink-0 items-center justify-between gap-4 border border-[#d4d4d4] bg-[#f3f3f3] px-4 py-3 text-sm max-[600px]:flex-col max-[600px]:items-start"
                role="status"
              >
                {copy.status === "saving"
                  ? "원본 저장을 확인하고 있습니다."
                  : "플래너를 복제하고 있습니다."}
              </p>
            )}
            {copy.error && !copyNameOpen && (
              <div
                className="mb-4 flex shrink-0 items-center justify-between gap-4 border border-[#d4d4d4] bg-[#f3f3f3] px-4 py-3 text-sm max-[600px]:flex-col max-[600px]:items-start border-[#555] bg-[#f0f0f0]"
                role="alert"
              >
                <p>
                  {copy.failureStage === "saving"
                    ? `원본을 저장하지 못해 복제하지 않았습니다. ${copy.error.message}`
                    : copy.canRetry
                      ? "복제 결과를 확인하지 못했습니다. 다시 시도해 결과를 확인해주세요."
                      : copy.error.message}
                </p>
                {copy.canRetry && (
                  <button
                    type="button"
                    className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] shrink-0"
                    aria-label="플래너 복제 다시 시도"
                    onClick={() => void finishCopy(copy.retry)}
                  >
                    다시 시도
                  </button>
                )}
              </div>
            )}
            <p className="shrink-0 pb-3 text-[13px] text-[#666]">
              플래너 {planners.length}개
            </p>
            <GenerationNotices jobs={jobs} retry={retry} />
            <PlannerList
              planners={planners}
              open={(id) => void move(`/planners/${encodeURIComponent(id)}`)}
              rename={setRename}
              remove={remove}
              copy={startCopy}
              copyingId={copy.pending ? copy.sourceId : null}
              copyDisabled={
                copy.pending ||
                (copy.canRetry && copy.failureStage === "copying")
              }
              newCopyId={newCopyId}
            />
            <footer className="flex shrink-0 items-center justify-between border-t border-[#d4d4d4] py-3 text-[13px] text-[#666]">
              <span>플래너는 계정에 저장됩니다.</span>
              <button
                type="button"
                className="min-h-11 cursor-pointer rounded-[3px] border border-transparent bg-transparent p-2 leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] underline underline-offset-4"
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
      {copyNameOpen && source && (
        <PlannerCopyNameDialog
          sourceName={source.name}
          existingNames={planners.map((planner) => planner.name)}
          pending={copy.pending}
          error={copy.error}
          close={() => {
            if (copy.pending) return;
            copy.cancelNameInput();
            setCopyNameOpen(false);
          }}
          submit={(name) => void finishCopy(() => copy.submitName(name))}
        />
      )}
    </>
  );
}
