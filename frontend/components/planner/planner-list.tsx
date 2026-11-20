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
        <ul className="planner-list">
          {planners.map((planner) => (
            <li
              className="planner-item"
              key={planner.id}
              aria-busy={copyingId === planner.id}
              data-new-copy={newCopyId === planner.id || undefined}
            >
              <div className="planner-info">
                <h2>
                  <button
                    type="button"
                    className="planner-open"
                    disabled={copyingId === planner.id}
                    onClick={() => open(planner.id)}
                  >
                    {planner.name}
                  </button>
                  {newCopyId === planner.id && (
                    <span className="planner-copy-badge">새 사본</span>
                  )}
                </h2>
                <p>{formatDate(planner.created_at)}</p>
              </div>
              <div className="planner-row-actions">
                <button
                  type="button"
                  disabled={copyDisabled}
                  aria-label={`${planner.name} 복제`}
                  onClick={() => copy(planner.id)}
                >
                  {copyingId === planner.id ? "복제 중…" : "복제"}
                </button>
                <button
                  type="button"
                  disabled={copyingId === planner.id}
                  onClick={() => rename(planner)}
                >
                  이름 변경
                </button>
                <button
                  type="button"
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
        <div className="planner-empty">
          <h2>아직 플래너가 없어요</h2>
          <p>첫 번째 인터뷰로 나의 가능성을 탐색해보세요.</p>
        </div>
      )}
    </>
  );
}
