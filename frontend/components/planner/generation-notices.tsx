"use client";

import type { Job } from "@/api/core";
import { Button } from "@/components/button";

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
        className="mb-4 grid gap-3 border border-rule bg-paper-raised p-4 text-[13px] md:grid-cols-[1fr_auto] md:items-center"
        key={job.id}
      >
        <span className="leading-relaxed">
          {job.status === "running"
            ? "플래너 생성 중…"
            : job.error || "생성을 시작할 수 있습니다."}
        </span>
        {job.status !== "running" && (
          <Button
            variant="secondary"
            className="justify-self-start text-[12px]"
            onClick={() => void retry(job)}
          >
            다시 시도
          </Button>
        )}
      </div>
    ));
}
