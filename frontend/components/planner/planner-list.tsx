"use client";

import type { Planner } from "@/api/core";
import { formatDate } from "@/lib/date";

export function PlannerList({
  planners,
  open,
  rename,
  remove,
  copy,
  copyingId,
  copyDisabled,
  newCopyId,
}: {
  planners: Planner[];
  open: (id: string) => void;
  rename: (planner: Planner) => void;
  remove: (id: string) => Promise<void>;
  copy: (id: string) => void;
  copyingId: string | null;
  copyDisabled: boolean;
  newCopyId: string | null;
}) {
  return (
    <>
      {planners.length ? (
        <ul className="m-0 min-h-0 flex-1 overflow-auto border-t border-[#d4d4d4] py-0 pr-2 pl-0">
          {planners.map((planner) => (
            <li
              className="flex items-center justify-between gap-6 border-b border-[#d4d4d4] py-[22px] last:border-b-0 data-[new-copy=true]:pl-3 data-[new-copy=true]:[box-shadow:inset_3px_0_0_#222] max-[600px]:flex-col max-[600px]:items-stretch max-[600px]:gap-3"
              key={planner.id}
              aria-busy={copyingId === planner.id}
              data-new-copy={newCopyId === planner.id || undefined}
            >
              <div className="min-w-0 flex-1">
                <h2 className="text-xl leading-[1.45] tracking-[-0.5px] [font-weight:650]">
                  <button
                    type="button"
                    className="min-h-11 cursor-pointer rounded-[3px] border max-w-full border-transparent bg-white p-2 text-left [overflow-wrap:anywhere] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
                    disabled={copyingId === planner.id}
                    onClick={() => open(planner.id)}
                  >
                    {planner.name}
                  </button>
                  {newCopyId === planner.id && (
                    <span className="ml-2 inline-block border border-[#d4d4d4] px-1.5 py-0.5 align-middle text-[11px] font-medium">
                      새 사본
                    </span>
                  )}
                </h2>
                <p className="mx-2 text-[13px] text-[#666]">
                  {formatDate(planner.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2 max-[600px]:flex-wrap [&>button]:max-[600px]:flex-1">
                <button
                  type="button"
                  className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
                  disabled={copyDisabled}
                  aria-label={`${planner.name} 복제`}
                  onClick={() => copy(planner.id)}
                >
                  {copyingId === planner.id ? "복제 중…" : "복제"}
                </button>
                <button
                  type="button"
                  className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
                  disabled={copyingId === planner.id}
                  onClick={() => rename(planner)}
                >
                  이름 변경
                </button>
                <button
                  type="button"
                  className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
                  disabled={copyingId === planner.id}
                  onClick={() => {
                    if (
                      window.confirm(`‘${planner.name}’ 플래너를 삭제할까요?`)
                    )
                      void remove(planner.id);
                  }}
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <h2 className="text-xl leading-[1.45] tracking-[-0.5px] [font-weight:650]">
            아직 플래너가 없어요
          </h2>
          <p className="max-w-[48ch] text-[#666]">
            첫 번째 인터뷰로 나의 가능성을 탐색해보세요.
          </p>
        </div>
      )}
    </>
  );
}
