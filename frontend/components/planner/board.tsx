"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import type { Piece, Plan, Planner } from "@/api/core";
import { useTimelineExport } from "@/hooks/planner/use-timeline-export";
import { formatDate } from "@/lib/date";
import { PieceEditor } from "./piece-editor";
import { PlanEditor } from "./plan-editor";
import { RatingEditor, RatingSummary } from "./rating-editor";
import { Timeline } from "./timeline";

export function Board({
  planner,
  change,
  list,
  create,
}: {
  planner: Planner;
  change: (planner: Planner) => void;
  list: () => void;
  create: () => void;
}) {
  const [active, setActive] = useState(0);
  const [piece, setPiece] = useState<Piece | null>(null);
  const [editing, setEditing] = useState<"plan" | "rating" | null>(null);
  const { exporting, error, download } = useTimelineExport();
  const plan = planner.plans[active];
  function update(value: Plan) {
    change({
      ...planner,
      plans: planner.plans.map((item, index) =>
        index === active ? value : item,
      ),
    });
  }
  function close() {
    setPiece(null);
    setEditing(null);
  }
  return (
    <div className="planner-board" data-plan={active}>
      <div className="board-heading">
        <div>
          <h1>{planner.name}</h1>
          <p className="small muted">{formatDate(planner.created_at)}</p>
        </div>
        <div className="board-actions">
          <button type="button" onClick={list}>
            내 플래너
          </button>
          <button type="button" onClick={create}>
            새 플래너
          </button>
        </div>
      </div>
      <div className="tabs" role="tablist" aria-label="플랜 선택">
        {planner.plans.map((item, index) => (
          <button
            key={item.kind}
            id={`tab-${index}`}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls="plan-panel"
            tabIndex={active === index ? 0 : -1}
            data-plan={index}
            onClick={() => {
              setActive(index);
              close();
            }}
            onKeyDown={(event) => {
              const last = planner.plans.length - 1;
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? last
                    : event.key === "ArrowRight"
                      ? (index + 1) % planner.plans.length
                      : event.key === "ArrowLeft"
                        ? (index + last) % planner.plans.length
                        : null;
              if (next === null) return;
              event.preventDefault();
              setActive(next);
              close();
              event.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>("button")
                [next]?.focus();
            }}
          >
            {String.fromCharCode(65 + index)} · {item.kind}
          </button>
        ))}
      </div>
      <div
        className="board-layout"
        role="tabpanel"
        id="plan-panel"
        aria-labelledby={`tab-${active}`}
      >
        <section className="timeline-pane">
          <div className="timeline-label">
            <h2>5년의 타임라인</h2>
            <span>길게 눌러 이동 · 양 끝으로 기간 조절</span>
          </div>
          <Timeline
            key={`${planner.id}-${active}`}
            pieces={plan.pieces}
            change={(pieces) => update({ ...plan, pieces })}
            edit={setPiece}
          />
          <button
            type="button"
            className="add-piece"
            onClick={() =>
              setPiece({
                id: crypto.randomUUID(),
                title: "",
                description: "",
                category: "work",
                start: 0,
                duration: 6,
              })
            }
          >
            + 활동 추가
          </button>
        </section>
        <aside className="details-pane">
          <div className="plan-heading">
            <h2>{plan.title}</h2>
            <button
              className="icon-button"
              type="button"
              aria-label="플랜 수정"
              onClick={() => setEditing("plan")}
            >
              <Pencil />
            </button>
          </div>
          <p className="plan-kind">{plan.kind}</p>
          <p className="plan-description">{plan.description}</p>
          <section className="rating-section">
            <div className="row between">
              <h3>자가평가</h3>
              <button
                type="button"
                className="text-button"
                onClick={() => setEditing("rating")}
              >
                평가하기
              </button>
            </div>
            <RatingSummary scores={plan.scores} />
          </section>
          <button
            type="button"
            className="wide space"
            disabled={exporting}
            onClick={(event) => {
              void download(
                plan.pieces,
                `${planner.name}-${String.fromCharCode(65 + active)}`,
                getComputedStyle(event.currentTarget)
                  .getPropertyValue("--plan-color")
                  .trim(),
              );
            }}
          >
            {exporting ? "이미지 생성 중…" : "타임라인 PNG 저장"}
          </button>
          {error && <p role="alert">{error}</p>}
        </aside>
      </div>
      <footer className="site-footer">
        <span>서로 다른 가능성을 나란히 탐색하세요.</span>
        <a href="https://ople.ink">Ople</a>
      </footer>
      {piece && (
        <PieceEditor
          piece={piece}
          close={close}
          save={(value) => {
            update({
              ...plan,
              pieces: plan.pieces.some((item) => item.id === value.id)
                ? plan.pieces.map((item) =>
                    item.id === value.id ? value : item,
                  )
                : [...plan.pieces, value],
            });
            close();
          }}
          {...(plan.pieces.some((item) => item.id === piece.id)
            ? {
                remove: () => {
                  update({
                    ...plan,
                    pieces: plan.pieces.filter((item) => item.id !== piece.id),
                  });
                  close();
                },
                duplicate: () => {
                  update({
                    ...plan,
                    pieces: [
                      ...plan.pieces,
                      { ...piece, id: crypto.randomUUID() },
                    ],
                  });
                  close();
                },
              }
            : {})}
        />
      )}
      {editing === "plan" && (
        <PlanEditor
          plan={plan}
          close={close}
          save={(value) => {
            update(value);
            close();
          }}
        />
      )}
      {editing === "rating" && (
        <RatingEditor
          plan={plan}
          close={close}
          save={(scores) => {
            update({ ...plan, scores });
            close();
          }}
        />
      )}
    </div>
  );
}
