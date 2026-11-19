"use client";

import type { Job } from "@/api/core";

export function GenerationNotices({
  jobs,
  retry,
}: {
  jobs: Job[];
  retry: (job: Job) => Promise<void>;
}) {
  return jobs
    .filter((job) => job.status !== "completed")
    .map((job) => (
      <div
        className="flex items-center justify-between gap-2 border border-[#d4d4d4] bg-[#f3f3f3] p-3.5 text-[13px]"
        key={job.id}
      >
        <span>
          {job.status === "running"
            ? "플래너 생성 중…"
            : job.error || "생성을 시작할 수 있습니다."}
        </span>
        {job.status !== "running" && (
          <button
            className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
            type="button"
            onClick={() => void retry(job)}
          >
            다시 시도
          </button>
        )}
      </div>
    ));
}
