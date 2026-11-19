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
      <div className="notice row between" key={job.id}>
        <span>
          {job.status === "running"
            ? "플래너 생성 중…"
            : job.error || "생성을 시작할 수 있습니다."}
        </span>
        {job.status !== "running" && (
          <button type="button" onClick={() => void retry(job)}>
            다시 시도
          </button>
        )}
      </div>
    ));
}
