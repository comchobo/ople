"use client";

import type { Planner } from "@/api/core";
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
        <ul className="planner-list">
          {planners.map((planner) => (
            <li className="planner-item" key={planner.id}>
              <div className="planner-info">
                <h2>
                  <button
                    type="button"
                    className="planner-open"
                    onClick={() => open(planner.id)}
                  >
                    {planner.name}
                  </button>
                </h2>
                <p>{formatDate(planner.created_at)}</p>
              </div>
              <div className="planner-row-actions">
                <button type="button" onClick={() => rename(planner)}>
                  이름 변경
                </button>
                <button
                  type="button"
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
