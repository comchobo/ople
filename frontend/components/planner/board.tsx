"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import type { Piece, Plan, Planner } from "@/api/core";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { useTimelineExport } from "@/hooks/planner/use-timeline-export";
import { formatDate } from "@/lib/date";
import { PieceEditor } from "./piece-editor";
import { PlanEditor } from "./plan-editor";
import { RatingEditor, RatingSummary } from "./rating-editor";
import { Timeline } from "./timeline";

const categoryDots = {
  work: "bg-work",
  creative: "bg-creative",
  relation: "bg-relation",
  rest: "bg-rest",
} as const;

const accents = [
  { text: "text-a", border: "border-a", soft: "bg-a-soft" },
  { text: "text-b", border: "border-b", soft: "bg-b-soft" },
  { text: "text-c", border: "border-c", soft: "bg-c-soft" },
] as const;

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
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink pb-5">
        <div className="min-w-0">
          <h1 className="text-[clamp(1.9rem,4vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.04em] [overflow-wrap:anywhere]">
            {planner.name}
          </h1>
          <p className="mt-2 text-[12px] text-muted">
            {formatDate(planner.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="secondary" onClick={list}>
            내 플래너
          </Button>
          <Button variant="secondary" onClick={create}>
            새 플래너
          </Button>
        </div>
      </div>

      <div
        className="mt-2 grid shrink-0 grid-cols-3 border-b border-ink"
        role="tablist"
        aria-label="플랜 선택"
      >
        {planner.plans.map((item, index) => (
          <button
            key={item.kind}
            id={`tab-${index}`}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls="plan-panel"
            className={`min-h-11 cursor-pointer border-0 border-t-2 bg-transparent px-2 py-4 text-left text-[12px] leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink md:px-3 md:text-[13px] ${
              active === index
                ? `${accents[index]?.border ?? "border-rule"} bg-paper-raised font-bold text-ink`
                : "border-transparent text-muted hover:text-ink"
            }`}
            onClick={() => {
              setActive(index);
              close();
            }}
          >
            <span className="font-sans text-[10px] font-bold tracking-[0.08em]">
              {String.fromCharCode(65 + index)} ·
            </span>{" "}
            {item.kind}
          </button>
        ))}
      </div>

      <div
        className="grid min-h-0 flex-1 gap-8 pt-7 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-12"
        role="tabpanel"
        id="plan-panel"
        aria-labelledby={`tab-${active}`}
      >
        <section className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-4">
            <h2 className="text-[20px] font-bold tracking-[-0.03em]">
              5년의 타임라인
            </h2>
            <span className="text-[11px] text-muted">
              길게 눌러 이동 · 양 끝으로 기간 조절
            </span>
          </div>
          <Timeline
            key={`${planner.id}-${active}`}
            pieces={plan.pieces}
            change={(pieces) => update({ ...plan, pieces })}
            edit={setPiece}
          />
          <p className="mt-2 text-[10px] text-muted md:hidden">
            가로로 넘겨 5년을 봅니다.
          </p>
          {plan.pieces.length > 0 && (
            <div className="mt-6">
              <p className="folio mb-2">활동 목록</p>
              <ul className="m-0 list-none border-t border-rule p-0">
                {plan.pieces.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule bg-transparent py-3 text-left hover:bg-paper-raised focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink"
                      onClick={() => setPiece(item)}
                    >
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span
                          aria-hidden="true"
                          className={`size-1.5 shrink-0 rounded-full ${categoryDots[item.category]}`}
                        />
                        <span className="text-[13px] leading-snug font-semibold [overflow-wrap:anywhere]">
                          {item.title}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] text-muted">
                        {item.start + 1}개월차부터 · {item.duration}개월
                        <span className="sr-only"> 수정</span>
                        <Pencil aria-hidden="true" className="size-3.5" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button
            variant="secondary"
            className="mt-4"
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
          </Button>
        </section>

        <aside className="min-w-0 border-t border-ink pt-5 lg:border-t-0 lg:border-l lg:border-rule lg:pt-0 lg:pl-10">
          <div className="mb-3 flex items-start gap-3">
            <h2 className="min-w-0 flex-1 text-[24px] leading-[1.25] font-bold tracking-[-0.04em] [overflow-wrap:anywhere] md:text-[28px]">
              {plan.title}
            </h2>
            <Button
              variant="icon"
              className="shrink-0"
              aria-label="플랜 수정"
              onClick={() => setEditing("plan")}
            >
              <Pencil className="size-4" />
            </Button>
          </div>
          <p className="whitespace-pre-wrap text-[15px] leading-[1.85] text-ink-soft [overflow-wrap:anywhere]">
            {plan.description}
          </p>

          <section className="mt-7 border-t border-rule pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[18px] font-bold tracking-[-0.02em]">
                자가평가
              </h3>
              <Button
                variant="quiet"
                className="px-2 text-[12px]"
                onClick={() => setEditing("rating")}
              >
                평가하기
              </Button>
            </div>
            <RatingSummary scores={plan.scores} />
          </section>

          <Button
            variant="secondary"
            className="mt-7 w-full"
            disabled={exporting}
            onClick={() => {
              void download(
                plan.pieces,
                `${planner.name}-${String.fromCharCode(65 + active)}`,
              );
            }}
          >
            {exporting ? "이미지 생성 중…" : "타임라인 PNG 저장"}
          </Button>
          {error && (
            <div className="mt-4">
              <Notice tone="error">{error}</Notice>
            </div>
          )}
        </aside>
      </div>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-4 text-[12px] text-muted">
        <span>서로 다른 가능성을 나란히 탐색하세요.</span>
        <a
          className="inline-flex min-h-11 items-center underline decoration-rule-strong underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink"
          href="https://ople.ink"
        >
          Ople
        </a>
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
    </>
  );
}
