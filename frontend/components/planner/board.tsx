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
    <>
      <div className="mb-[18px] flex shrink-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="mb-1.5 text-[26px] leading-[1.35] tracking-[-1px] [font-weight:650] text-balance [overflow-wrap:anywhere]">
            {planner.name}
          </h1>
          <p className="text-[12px] text-[#666]">
            {formatDate(planner.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
            type="button"
            onClick={list}
          >
            내 플래너
          </button>
          <button
            className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
            type="button"
            onClick={create}
          >
            새 플래너
          </button>
        </div>
      </div>
      <div
        className="mb-6 grid shrink-0 grid-cols-3 border-b border-[#333]"
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
            className={`min-h-11 cursor-pointer rounded-none border-0 bg-white p-[13px] leading-[1.4] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] ${active === index ? "text-[#222] [font-weight:650] [box-shadow:inset_0_-3px_#222]" : "text-[#666]"}`}
            onClick={() => {
              setActive(index);
              close();
            }}
          >
            {String.fromCharCode(65 + index)} · {item.kind}
          </button>
        ))}
      </div>
      <div
        className="grid min-h-0 flex-1 grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8"
        role="tabpanel"
        id="plan-panel"
        aria-labelledby={`tab-${active}`}
      >
        <section className="-ml-2 min-h-0 min-w-0 overflow-auto px-2 pb-5 [scrollbar-color:#aaa_#f3f3f3] [scrollbar-width:thin]">
          <div className="flex items-center justify-between gap-3 pb-4">
            <h2 className="text-base leading-[1.45] tracking-normal [font-weight:650]">
              5년의 타임라인
            </h2>
            <span className="text-[12px] text-[#666]">
              길게 눌러 이동 · 양 끝으로 기간 조절
            </span>
          </div>
          <Timeline
            key={`${planner.id}-${active}`}
            pieces={plan.pieces}
            change={(pieces) => update({ ...plan, pieces })}
            edit={setPiece}
          />
          <button
            type="button"
            className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] mt-3.5"
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
        <aside className="min-h-0 min-w-0 overflow-auto pr-2 pb-5 pl-0 [scrollbar-color:#aaa_#f3f3f3] [scrollbar-width:thin]">
          <p className="mb-[5px] text-[12px] text-[#666]">{plan.kind}</p>
          <div className="mb-2 flex items-start gap-2">
            <h2 className="min-w-0 flex-1 pt-[5px] text-xl leading-[1.45] tracking-[-0.5px] [font-weight:650] [overflow-wrap:anywhere]">
              {plan.title}
            </h2>
            <button
              className="inline-grid min-h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-[3px] border border-[#d4d4d4] bg-white p-0 leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
              type="button"
              aria-label="플랜 수정"
              onClick={() => setEditing("plan")}
            >
              <Pencil className="size-[15px]" />
            </button>
          </div>
          <p className="mb-5 whitespace-pre-wrap text-sm leading-[1.8] text-[#555] [overflow-wrap:anywhere]">
            {plan.description}
          </p>
          <section className="mt-5 border-t border-[#d4d4d4] pt-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base leading-[1.6] [font-weight:650]">
                자가평가
              </h3>
              <button
                type="button"
                className="min-h-11 cursor-pointer rounded-[3px] border border-transparent bg-transparent p-2 leading-[1.4] underline underline-offset-4 hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
                onClick={() => setEditing("rating")}
              >
                평가하기
              </button>
            </div>
            <RatingSummary scores={plan.scores} />
          </section>
          <button
            type="button"
            className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] mt-6 w-full"
            disabled={exporting}
            onClick={() => {
              void download(
                plan.pieces,
                `${planner.name}-${String.fromCharCode(65 + active)}`,
              );
            }}
          >
            {exporting ? "이미지 생성 중…" : "타임라인 PNG 저장"}
          </button>
          {error && <p role="alert">{error}</p>}
        </aside>
      </div>
      <footer className="flex shrink-0 items-center justify-between border-t border-[#d4d4d4] py-3 text-[13px] text-[#666]">
        <span>서로 다른 가능성을 나란히 탐색하세요.</span>
        <a
          className="focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px]"
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
