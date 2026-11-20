"use client";

import type { Planner } from "@/api/core";
import { Button } from "@/components/button";
import { formatDate } from "@/lib/date";

export function PlannerList({
  planners,
  open,
  rename,
  remove,
}: {
  planners: Planner[];
  open: (id: string) => void;
  rename: (planner: Planner) => void;
  remove: (id: string) => Promise<void>;
}) {
  return (
    <>
      {planners.length ? (
        <ul className="m-0 list-none border-t border-ink p-0">
          {planners.map((planner, index) => (
            <li
              className="grid gap-4 border-b border-rule py-5 md:grid-cols-[1fr_auto] md:items-center md:py-6"
              key={planner.id}
            >
              <div className="flex min-w-0 items-baseline gap-4 md:gap-6">
                <span className="font-sans text-[10px] font-semibold tracking-[0.08em] tabular-nums text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[20px] leading-snug font-bold tracking-[-0.03em] md:text-[24px]">
                    <button
                      type="button"
                      className="max-w-full min-h-11 cursor-pointer border-0 bg-transparent p-0 text-left text-inherit [overflow-wrap:anywhere] hover:underline hover:decoration-rule-strong hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink"
                      onClick={() => open(planner.id)}
                    >
                      {planner.name}
                    </button>
                  </h2>
                  <p className="mt-1 text-[12px] text-muted">
                    {formatDate(planner.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 pl-9 md:pl-0">
                <Button
                  variant="quiet"
                  className="px-3 text-[12px]"
                  onClick={() => rename(planner)}
                >
                  이름 변경
                </Button>
                <Button
                  variant="danger"
                  className="px-3 text-[12px]"
                  onClick={() => {
                    if (
                      window.confirm(`‘${planner.name}’ 플래너를 삭제할까요?`)
                    )
                      void remove(planner.id);
                  }}
                >
                  삭제
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start justify-center gap-3 border-t border-rule py-20 md:items-center md:py-28 md:text-center">
          <h2 className="text-[24px] font-bold tracking-[-0.03em]">
            아직 플래너가 없어요
          </h2>
          <p className="max-w-[48ch] text-[14px] leading-relaxed text-muted">
            첫 번째 인터뷰로 나의 가능성을 탐색해보세요.
          </p>
        </div>
      )}
    </>
  );
}
