"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import {
  createdLabel,
  type Piece,
  type Plan,
  type Planner,
} from "../../lib/product";
import { Timeline } from "./timeline";

const ratings = [
  ["나의 자원", "필요한 시간·비용·역량을 확보할 수 있나요?"],
  ["호감도", "이 삶의 모습에 얼마나 끌리나요?"],
  ["자신감", "실행할 수 있다는 자신감은 어느 정도인가요?"],
  ["일관성", "내 가치와 원하는 삶에 얼마나 맞나요?"],
];
const directions: Record<string, string> = {
  A: "현재 방향을 발전시키는 계획",
  B: "다른 방향을 탐색하는 계획",
  C: "원하는 삶에서 출발하는 계획",
};

export function Board({ id }: { id: string }) {
  const [planner, setPlanner] = useState<Planner | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const retry = useRef<(() => Promise<void>) | null>(null);
  const [editor, setEditor] = useState<
    "plan" | "piece" | "rating" | "delete-piece" | "reset-rating" | null
  >(null);
  const [draft, setDraft] = useState<Piece | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scores, setScores] = useState([5, 5, 5, 5]);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const modal = dialog.current;
    if (editor && modal && !modal.open) modal.showModal();
    if (!editor && modal?.open) modal.close();
  }, [editor]);
  const load = useCallback(async () => {
    try {
      setPlanner(await api<Planner>(`/planners/${id}`));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty || busy || editor) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy, editor]);
  const plan = planner?.plans[index];
  function updatePlan(transform: (plan: Plan) => Plan) {
    if (!plan) return;
    setPlanner((p) =>
      p
        ? {
            ...p,
            plans: p.plans.map((row) =>
              row.id === plan.id ? transform(row) : row,
            ),
          }
        : p,
    );
  }
  async function persist(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    retry.current = action;
    try {
      await action();
      retry.current = null;
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
      setDirty(true);
    } finally {
      setBusy(false);
    }
  }
  function saveRange(piece: Piece) {
    updatePlan((p) => ({
      ...p,
      pieces: p.pieces.map((row) => (row.id === piece.id ? piece : row)),
    }));
    void persist(async () => {
      await api(`/pieces/${piece.id}`, "PATCH", piece);
    });
  }
  function openPiece(piece?: Piece) {
    if (!plan) return;
    setDraft(
      piece ?? {
        id: "",
        plan_id: plan.id,
        title: "",
        description: "",
        category: "일",
        start_month: 1,
        duration: 1,
      },
    );
    setEditor("piece");
  }
  async function saveEditor(e: React.FormEvent) {
    e.preventDefault();
    if (!plan) return;
    await persist(async () => {
      if (editor === "plan") {
        await api(`/plans/${plan.id}`, "PATCH", { title, description });
        updatePlan((p) => ({ ...p, title: title.trim(), description }));
      } else if (editor === "piece" && draft) {
        const result = await api<Piece>(
          draft.id ? `/pieces/${draft.id}` : `/plans/${plan.id}/pieces`,
          draft.id ? "PATCH" : "POST",
          draft,
        );
        updatePlan((p) => ({
          ...p,
          pieces: draft.id
            ? p.pieces.map((row) => (row.id === result.id ? result : row))
            : [...p.pieces, result],
        }));
      } else if (editor === "rating") {
        await api(`/plans/${plan.id}/rating`, "PUT", { scores });
        updatePlan((p) => ({ ...p, scores: [...scores] }));
      }
      setEditor(null);
    });
  }
  async function pieceAction(mode: "duplicate" | "delete") {
    if (!draft || !plan) return;
    await persist(async () => {
      if (mode === "delete") {
        await api(`/pieces/${draft.id}`, "DELETE");
        updatePlan((p) => ({
          ...p,
          pieces: p.pieces.filter((row) => row.id !== draft.id),
        }));
      } else {
        const result = await api<Piece>(
          `/pieces/${draft.id}/duplicate`,
          "POST",
        );
        updatePlan((p) => ({ ...p, pieces: [...p.pieces, result] }));
      }
      setEditor(null);
    });
  }
  const locked = busy || dirty;
  const editingLocked = locked || editor !== null;
  const destructiveConfirmation =
    editor === "delete-piece" || editor === "reset-rating";
  const cannotClose = busy || (dirty && !destructiveConfirmation);
  function closeEditor() {
    if (cannotClose) return;
    if (destructiveConfirmation) {
      retry.current = null;
      setError("");
      setDirty(false);
    }
    setEditor(
      editor === "delete-piece"
        ? "piece"
        : editor === "reset-rating"
          ? "rating"
          : null,
    );
  }
  function navigate(event: React.MouseEvent) {
    if (
      (editor || dirty || busy) &&
      !confirm("편집 또는 저장 중인 변경이 있습니다. 이 화면을 나갈까요?")
    )
      event.preventDefault();
  }
  const modalTitle =
    editor === "plan"
      ? "계획 제목·설명 수정"
      : editor === "piece"
        ? draft?.id
          ? "조각 수정"
          : "조각 추가"
        : editor === "delete-piece"
          ? "조각을 삭제할까요?"
          : editor === "reset-rating"
            ? "평가를 초기화할까요?"
            : "나의 자기평가";
  const editIcon = (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15Z" />
    </svg>
  );
  const errorNotice = error && (
    <div role="alert" className="mt-5 border border-[#d4d4d4] p-3 text-[13px]">
      {error} 변경은 현재 화면에 유지됩니다.{" "}
      <button
        type="button"
        disabled={busy}
        onClick={() => (retry.current ? persist(retry.current) : load())}
      >
        다시 시도
      </button>
    </div>
  );
  return (
    <main className="mx-auto flex h-[calc(min(100dvh,834px)-70px)] w-full max-w-[1194px] min-h-0 flex-col overflow-hidden bg-white p-7 pb-0 text-[15px] leading-[1.6] text-[#222] [font-family:-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] [word-break:keep-all] selection:bg-[#222] selection:text-white [&_.text-xs]:leading-[1.6] [&_.text-sm]:leading-[1.6] [&_.text-base]:leading-[1.6] [&_h1]:text-balance [&_button]:min-h-11 [&_button]:rounded-[3px] [&_button]:border [&_button]:border-[#d4d4d4] [&_button]:bg-white [&_button]:px-3.5 [&_button]:py-[9px] [&_button]:leading-[1.4] [&_button]:cursor-pointer [&_button:hover]:border-[#999] [&_button:hover]:bg-[#f3f3f3] [&_button:disabled]:cursor-default [&_button:disabled]:opacity-45 [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-3 [&_:focus-visible]:outline-[#222] [&_input]:block [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-[3px] [&_input]:border [&_input]:border-[#aaa] [&_input]:bg-white [&_input]:p-[11px] [&_input]:caret-[#222] [&_textarea]:block [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-[3px] [&_textarea]:border [&_textarea]:border-[#aaa] [&_textarea]:bg-white [&_textarea]:p-[11px] [&_select]:block [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-[3px] [&_select]:border [&_select]:border-[#aaa] [&_select]:bg-white [&_select]:p-[11px]">
      <section className="mb-[18px] flex shrink-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="mb-1.5 text-[26px] leading-[1.35] font-[650] tracking-[-1px] [overflow-wrap:anywhere]">
            {planner?.name ?? "계획 보드"}
          </h1>
          {planner && (
            <p className="text-xs text-[#666]">
              {createdLabel(planner.created_at)} 생성
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/planners"
            onClick={navigate}
            className="rounded-[3px] border border-[#d4d4d4] px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3]"
          >
            플래너 목록
          </Link>
          <Link
            href="/interviews/new"
            onClick={navigate}
            className="rounded-[3px] border border-[#d4d4d4] px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3]"
          >
            새 플래너 만들기
          </Link>
        </div>
      </section>
      {!planner && (
        <>
          <p role="status" className="text-[#666]">
            보드를 불러오는 중…
          </p>
          {errorNotice}
        </>
      )}
      {planner && plan && (
        <>
          <div
            role="tablist"
            aria-label="세 가지 계획"
            className="mb-6 grid shrink-0 grid-cols-3 border-b border-[#333]"
          >
            {planner.plans.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                id={`tab-${p.kind}`}
                aria-controls={`panel-${p.kind}`}
                aria-selected={i === index}
                tabIndex={i === index ? 0 : -1}
                disabled={editingLocked}
                className={`rounded-none! border-0! p-[13px]! ${i === index ? "font-[650] shadow-[inset_0_-3px_#222]" : "text-[#666]"}`}
                onClick={() => setIndex(i)}
                onKeyDown={(e) => {
                  const next =
                    e.key === "ArrowRight"
                      ? (index + 1) % 3
                      : e.key === "ArrowLeft"
                        ? (index + 2) % 3
                        : e.key === "Home"
                          ? 0
                          : e.key === "End"
                            ? 2
                            : null;
                  if (next !== null) {
                    e.preventDefault();
                    setIndex(next);
                    document
                      .getElementById(`tab-${planner.plans[next].kind}`)
                      ?.focus();
                  }
                }}
              >
                Plan {p.kind}
              </button>
            ))}
          </div>
          <section
            role="tabpanel"
            id={`panel-${plan.kind}`}
            aria-labelledby={`tab-${plan.kind}`}
            className="grid min-h-0 flex-1 grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8"
          >
            <section
              aria-label="타임라인 편집"
              className="-ml-2 min-h-0 min-w-0 overflow-auto px-2 pb-5 [scrollbar-color:#aaa_#f3f3f3] [scrollbar-width:thin]"
            >
              <div className="flex items-center justify-between gap-3 pb-4">
                <h2 className="text-base font-[650]">5년 타임라인</h2>
                <span className="text-xs text-[#666]">시작 시점 · 기간</span>
              </div>
              <Timeline
                key={plan.id}
                pieces={plan.pieces}
                start={planner.start_month}
                disabled={editingLocked}
                edit={openPiece}
                save={saveRange}
              />
              <button
                type="button"
                className="mt-3.5 w-full"
                aria-label="조각 추가"
                disabled={editingLocked}
                onClick={() => openPiece()}
              >
                + 조각 추가
              </button>
            </section>
            <aside
              aria-label="계획 설명과 자기평가"
              className="min-h-0 min-w-0 overflow-auto pr-2 pb-5 [scrollbar-color:#aaa_#f3f3f3] [scrollbar-width:thin]"
            >
              <p className="mb-[5px] text-xs text-[#666]">
                {directions[plan.kind]}
              </p>
              <div className="mb-2 flex items-start gap-2">
                <h2 className="min-w-0 flex-1 pt-[5px] text-xl leading-[1.45] font-[650] tracking-[-.5px] [overflow-wrap:anywhere]">
                  {plan.title}
                </h2>
                <button
                  type="button"
                  aria-label="계획 제목과 설명 수정"
                  title="계획 제목과 설명 수정"
                  className="grid w-11 shrink-0 place-items-center p-0!"
                  disabled={editingLocked}
                  onClick={() => {
                    setTitle(plan.title);
                    setDescription(plan.description);
                    setEditor("plan");
                  }}
                >
                  {editIcon}
                </button>
              </div>
              <p className="mb-5 text-sm leading-[1.8]! whitespace-pre-wrap text-[#555] [overflow-wrap:anywhere]">
                {plan.description}
              </p>
              <section className="mt-5 border-t border-[#d4d4d4] pt-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-[650]">나의 자기평가</h3>
                  <button
                    type="button"
                    className="text-xs"
                    disabled={editingLocked}
                    onClick={() => {
                      setScores(plan.scores ? [...plan.scores] : [5, 5, 5, 5]);
                      setEditor("rating");
                    }}
                  >
                    {plan.scores ? "평가 수정" : "평가하기"}
                  </button>
                </div>
                <p className="text-xs text-[#666]">
                  선택 사항 · AI 점수가 아닌 직접 입력한 평가입니다.
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2.5">
                  {ratings.map(([name, help], i) => (
                    <div
                      key={name}
                      className="border border-[#d4d4d4] p-2 text-xs"
                    >
                      <div className="flex flex-wrap gap-x-1">
                        <dt title={help}>{name}</dt>
                        <dd>
                          {plan.scores ? `${plan.scores[i]} / 10` : "미평가"}
                        </dd>
                      </div>
                      <div className="mt-[7px] h-[3px] bg-[#eee]">
                        <span
                          className="block h-full bg-[#777]"
                          style={{ width: `${(plan.scores?.[i] ?? 0) * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </dl>
              </section>
              {!editor && errorNotice}
              <p
                role="status"
                aria-live="polite"
                className={busy ? "mt-5 text-[13px] text-[#666]" : "sr-only"}
              >
                {busy
                  ? "서버에 저장 중…"
                  : dirty
                    ? "아직 저장하지 못했습니다."
                    : editor
                      ? "편집 중입니다. 적용하거나 취소해주세요."
                      : "모든 변경이 저장되었습니다."}
              </p>
            </aside>
          </section>
          <dialog
            ref={dialog}
            aria-labelledby="board-dialog-title"
            onCancel={(e) => {
              e.preventDefault();
              closeEditor();
            }}
            className="m-auto max-h-[min(786px,calc(100dvh-48px))] w-[560px] max-w-[calc(100%-48px)] overflow-auto overscroll-contain rounded-[7px] border border-[#999] bg-white p-0 text-[#222] backdrop:bg-black/30"
          >
            {editor && (
              <div className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2
                    id="board-dialog-title"
                    className="text-xl leading-[1.45] font-[650] tracking-[-.5px]"
                  >
                    {modalTitle}
                  </h2>
                  <button
                    type="button"
                    disabled={cannotClose}
                    onClick={closeEditor}
                  >
                    닫기
                  </button>
                </div>
                {editor === "delete-piece" || editor === "reset-rating" ? (
                  <>
                    <p className="mb-5 text-sm text-[#555]">
                      {editor === "delete-piece"
                        ? "이 조각을 현재 계획에서 삭제합니다."
                        : "이 계획의 네 항목을 모두 미평가로 되돌립니다."}
                    </p>
                    {errorNotice}
                    <div className="mt-6 flex justify-between gap-2 border-t border-[#d4d4d4] pt-4">
                      <button
                        type="button"
                        disabled={cannotClose}
                        onClick={closeEditor}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        disabled={busy || dirty}
                        className="ml-auto border-[#222]! bg-[#222]! text-white! hover:bg-[#444]!"
                        onClick={() =>
                          editor === "delete-piece"
                            ? pieceAction("delete")
                            : persist(async () => {
                                await api(`/plans/${plan.id}/rating`, "DELETE");
                                updatePlan((p) => ({ ...p, scores: null }));
                                setEditor(null);
                              })
                        }
                      >
                        {editor === "delete-piece"
                          ? "조각 삭제"
                          : "평가 초기화"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {editor === "rating" && (
                      <p className="mb-5 text-sm text-[#555]">
                        0은 가장 낮음, 10은 가장 높음입니다.
                      </p>
                    )}
                    <form onSubmit={saveEditor} aria-label={modalTitle}>
                      <fieldset
                        disabled={busy}
                        onChange={() => {
                          retry.current = null;
                          setError("");
                          setDirty(false);
                        }}
                      >
                        {editor === "plan" && (
                          <>
                            <label
                              className="mb-1.5 block text-[13px]"
                              htmlFor="plan-title"
                            >
                              제목
                            </label>
                            <input
                              id="plan-title"
                              required
                              pattern=".*\S.*"
                              maxLength={100}
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                            />
                            <label
                              className="mt-4 mb-1.5 block text-[13px]"
                              htmlFor="plan-description"
                            >
                              설명
                            </label>
                            <textarea
                              id="plan-description"
                              rows={4}
                              maxLength={2000}
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                            />
                          </>
                        )}
                        {editor === "piece" && draft && (
                          <>
                            <label
                              className="mb-1.5 block text-[13px]"
                              htmlFor="piece-title"
                            >
                              제목
                            </label>
                            <input
                              id="piece-title"
                              required
                              pattern=".*\S.*"
                              maxLength={100}
                              placeholder="예: 주말 제작 모임"
                              value={draft.title}
                              onChange={(e) =>
                                setDraft({ ...draft, title: e.target.value })
                              }
                            />
                            <label
                              className="mt-4 mb-1.5 block text-[13px]"
                              htmlFor="piece-description"
                            >
                              내용 <span className="text-[#666]">(선택)</span>
                            </label>
                            <textarea
                              id="piece-description"
                              rows={3}
                              maxLength={2000}
                              value={draft.description}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  description: e.target.value,
                                })
                              }
                            />
                            <label
                              className="mt-4 mb-1.5 block text-[13px]"
                              htmlFor="piece-category"
                            >
                              영역
                            </label>
                            <select
                              id="piece-category"
                              value={draft.category}
                              onChange={(e) =>
                                setDraft({ ...draft, category: e.target.value })
                              }
                            >
                              {["일", "창작", "관계", "휴식"].map((x) => (
                                <option key={x}>{x}</option>
                              ))}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label
                                  className="mt-4 mb-1.5 block text-[13px]"
                                  htmlFor="piece-start"
                                >
                                  시작 시점
                                </label>
                                <select
                                  id="piece-start"
                                  value={draft.start_month}
                                  onChange={(e) => {
                                    const n = Number(e.target.value);
                                    setDraft({
                                      ...draft,
                                      start_month: n,
                                      duration: Math.min(
                                        draft.duration,
                                        61 - n,
                                      ),
                                    });
                                  }}
                                >
                                  {Array.from(
                                    { length: 60 },
                                    (_, i) => i + 1,
                                  ).map((month) => (
                                    <option key={month} value={month}>
                                      {Math.floor((month - 1) / 12) + 1}년차{" "}
                                      {((month - 1) % 12) + 1}개월째
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label
                                  className="mt-4 mb-1.5 block text-[13px]"
                                  htmlFor="piece-duration"
                                >
                                  기간 (개월)
                                </label>
                                <input
                                  id="piece-duration"
                                  type="number"
                                  required
                                  min={1}
                                  max={61 - draft.start_month}
                                  value={draft.duration}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      duration: Number(e.target.value),
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <p className="mt-2 text-xs text-[#666]">
                              기간은 5년 범위 안에서 설정합니다.
                            </p>
                          </>
                        )}
                        {editor === "rating" &&
                          ratings.map(([name, help], i) => (
                            <div
                              key={name}
                              className="mt-[18px] border-t border-[#ddd] pt-4 first:mt-0"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <label
                                  htmlFor={`rating-${i}`}
                                  className="text-sm font-semibold"
                                >
                                  {name}
                                </label>
                                <output htmlFor={`rating-${i}`}>
                                  {scores[i]} / 10
                                </output>
                              </div>
                              <p className="mt-[3px] mb-2 text-xs text-[#666]">
                                {help}
                              </p>
                              <input
                                id={`rating-${i}`}
                                className="border-0! p-0! accent-[#333]"
                                type="range"
                                min={0}
                                max={10}
                                step={1}
                                value={scores[i]}
                                onChange={(e) =>
                                  setScores((values) =>
                                    values.map((v, j) =>
                                      j === i ? Number(e.target.value) : v,
                                    ),
                                  )
                                }
                              />
                            </div>
                          ))}
                        {errorNotice}
                        <div className="mt-6 flex justify-between gap-2 border-t border-[#d4d4d4] pt-4">
                          {editor === "piece" && draft?.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={locked}
                                onClick={() => pieceAction("duplicate")}
                              >
                                복제
                              </button>
                              <button
                                type="button"
                                className="border-transparent! bg-transparent! p-2! underline underline-offset-4"
                                disabled={locked}
                                onClick={() => setEditor("delete-piece")}
                              >
                                삭제
                              </button>
                            </div>
                          ) : editor === "rating" ? (
                            <button
                              type="button"
                              disabled={locked || !plan.scores}
                              className="border-transparent! bg-transparent! p-2! underline underline-offset-4"
                              onClick={() => setEditor("reset-rating")}
                            >
                              평가 초기화
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={dirty}
                              onClick={closeEditor}
                            >
                              취소
                            </button>
                          )}
                          <button
                            type="submit"
                            className="ml-auto border-[#222]! bg-[#222]! text-white! hover:bg-[#444]!"
                          >
                            {editor === "rating" ? "평가 저장" : "적용"}
                          </button>
                        </div>
                      </fieldset>
                    </form>
                  </>
                )}
              </div>
            )}
          </dialog>
        </>
      )}
    </main>
  );
}
