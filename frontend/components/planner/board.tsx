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
import s from "./feature.module.css";
import { Timeline } from "./timeline";

const ratings = [
  ["나의 자원", "필요한 시간·비용·역량을 확보할 수 있나요?"],
  ["호감도", "이 삶의 모습에 얼마나 끌리나요?"],
  ["자신감", "실행할 수 있다는 자신감은 어느 정도인가요?"],
  ["일관성", "내 가치와 원하는 삶에 얼마나 맞나요?"],
];
const directions: Record<string, string> = {
  A: "현재 방향 발전",
  B: "다른 방향 탐색",
  C: "원하는 삶에서 출발",
};

export function Board({ id }: { id: string }) {
  const [planner, setPlanner] = useState<Planner | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const retry = useRef<(() => Promise<void>) | null>(null);
  const [editor, setEditor] = useState<"plan" | "piece" | "rating" | null>(
    null,
  );
  const [draft, setDraft] = useState<Piece | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scores, setScores] = useState([5, 5, 5, 5]);
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
    if (mode === "delete" && !confirm(`'${draft.title}' 조각을 삭제할까요?`))
      return;
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
  function navigate(event: React.MouseEvent) {
    if (
      (editor || dirty || busy) &&
      !confirm("편집 또는 저장 중인 변경이 있습니다. 이 화면을 나갈까요?")
    )
      event.preventDefault();
  }
  return (
    <main className={s.surface}>
      <div className={s.content}>
        <div className={s.heading}>
          <div>
            <h1>{planner?.name ?? "계획 보드"}</h1>
            {planner && (
              <p className={s.muted}>{createdLabel(planner.created_at)} 생성</p>
            )}
          </div>
          <div className={s.actions}>
            <Link href="/planners" onClick={navigate}>
              내 플래너
            </Link>
            <Link href="/interviews/new" onClick={navigate}>
              새 인터뷰
            </Link>
          </div>
        </div>
        {error && (
          <div role="alert" className={s.error}>
            {error} 변경은 현재 화면에 유지됩니다.{" "}
            <button
              type="button"
              disabled={busy}
              onClick={() => (retry.current ? persist(retry.current) : load())}
            >
              다시 시도
            </button>
          </div>
        )}
        <p role="status" aria-live="polite" className={s.muted}>
          {busy
            ? "서버에 저장 중…"
            : dirty
              ? "아직 저장하지 못했습니다."
              : editor
                ? "편집 중입니다. 적용하거나 취소해주세요."
                : planner
                  ? "모든 변경이 저장되었습니다."
                  : "보드를 불러오는 중…"}
        </p>
        {planner && plan && (
          <>
            <div className={s.tabs} role="tablist" aria-label="세 가지 계획">
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
                  onClick={() => {
                    setIndex(i);
                    setEditor(null);
                  }}
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
                      setEditor(null);
                      document
                        .getElementById(`tab-${planner.plans[next].kind}`)
                        ?.focus();
                    }
                  }}
                >
                  Plan {p.kind} · {directions[p.kind]}
                </button>
              ))}
            </div>
            <section
              role="tabpanel"
              id={`panel-${plan.kind}`}
              aria-labelledby={`tab-${plan.kind}`}
              className={s.board}
            >
              <div>
                <div className={s.heading}>
                  <div>
                    <h2>{plan.title}</h2>
                    <p>{plan.description}</p>
                  </div>
                  <button
                    type="button"
                    disabled={editingLocked}
                    onClick={() => {
                      setTitle(plan.title);
                      setDescription(plan.description);
                      setEditor("plan");
                    }}
                  >
                    계획 편집
                  </button>
                </div>
                <div className={s.heading}>
                  <h2>5년 타임라인</h2>
                  <button
                    type="button"
                    disabled={editingLocked}
                    onClick={() => openPiece()}
                  >
                    조각 추가
                  </button>
                </div>
                <Timeline
                  key={plan.id}
                  pieces={plan.pieces}
                  start={planner.start_month}
                  disabled={editingLocked}
                  edit={openPiece}
                  save={saveRange}
                />
              </div>
              <aside>
                <section className={s.ratings}>
                  <h2>나의 자기평가</h2>
                  <p className={s.muted}>
                    선택 입력입니다. AI가 부여한 점수가 아닙니다.
                  </p>
                  <dl>
                    {ratings.map(([name, help], i) => (
                      <div key={name}>
                        <dt title={help}>{name}</dt>
                        <dd>
                          {plan.scores ? `${plan.scores[i]} / 10` : "미평가"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className={s.actions}>
                    <button
                      type="button"
                      disabled={editingLocked}
                      onClick={() => {
                        setScores(
                          plan.scores ? [...plan.scores] : [5, 5, 5, 5],
                        );
                        setEditor("rating");
                      }}
                    >
                      평가 입력
                    </button>
                    <button
                      type="button"
                      disabled={editingLocked || !plan.scores}
                      onClick={() => {
                        if (
                          confirm(
                            "이 계획의 네 평가를 모두 미평가로 초기화할까요?",
                          )
                        )
                          void persist(async () => {
                            await api(`/plans/${plan.id}/rating`, "DELETE");
                            updatePlan((p) => ({ ...p, scores: null }));
                          });
                      }}
                    >
                      평가 초기화
                    </button>
                  </div>
                </section>
              </aside>
            </section>
            {editor && (
              <form
                className={s.editor}
                onSubmit={saveEditor}
                aria-label={
                  editor === "plan"
                    ? "계획 편집"
                    : editor === "piece"
                      ? "활동 조각 편집"
                      : "자기평가 입력"
                }
              >
                <h2>
                  {editor === "plan"
                    ? "계획 편집"
                    : editor === "piece"
                      ? "활동 조각"
                      : "자기평가 입력"}
                </h2>
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
                      <label>
                        제목
                        <input
                          required
                          maxLength={100}
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </label>
                      <label>
                        설명
                        <textarea
                          maxLength={2000}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </label>
                    </>
                  )}
                  {editor === "piece" && draft && (
                    <>
                      <label>
                        제목
                        <input
                          required
                          maxLength={100}
                          value={draft.title}
                          onChange={(e) =>
                            setDraft({ ...draft, title: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        내용
                        <textarea
                          maxLength={2000}
                          value={draft.description}
                          onChange={(e) =>
                            setDraft({ ...draft, description: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        영역
                        <select
                          value={draft.category}
                          onChange={(e) =>
                            setDraft({ ...draft, category: e.target.value })
                          }
                        >
                          {["일", "창작", "관계", "휴식"].map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        시작 월 (1–60)
                        <input
                          type="number"
                          required
                          min={1}
                          max={60}
                          value={draft.start_month}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            setDraft({
                              ...draft,
                              start_month: n,
                              duration: Math.min(draft.duration, 61 - n),
                            });
                          }}
                        />
                      </label>
                      <label>
                        기간 (개월)
                        <input
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
                      </label>
                      {draft.id && (
                        <div className={s.actions}>
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => pieceAction("duplicate")}
                          >
                            복제
                          </button>
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => pieceAction("delete")}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {editor === "rating" &&
                    ratings.map(([name, help], i) => (
                      <label key={name}>
                        {name} · {scores[i]}점
                        <span className={s.muted}>{help}</span>
                        <input
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
                      </label>
                    ))}
                  <div className={s.actions}>
                    <button type="submit" className={s.primary} disabled={busy}>
                      적용
                    </button>
                    <button
                      type="button"
                      disabled={busy || dirty}
                      onClick={() => setEditor(null)}
                    >
                      취소
                    </button>
                  </div>
                </fieldset>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
