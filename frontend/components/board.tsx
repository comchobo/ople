"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import type { Category, Piece, Plan, Planner, ScoreKey } from "@/api/core";
import { formatDate } from "@/lib/date";
import { Modal } from "./modal";
import { exportTimeline, Timeline } from "./timeline";

const categories: Record<Category, string> = {
  work: "일",
  creative: "창작",
  relation: "관계",
  rest: "휴식",
};
const ratingLabels: Record<ScoreKey, string> = {
  resources: "자원",
  appeal: "호감",
  confidence: "자신감",
  coherence: "일관성",
};
const ratingHelp: Record<ScoreKey, string> = {
  resources: "필요한 시간·비용·역량을 확보할 수 있나요?",
  appeal: "이 삶의 모습에 얼마나 끌리나요?",
  confidence: "실행할 수 있다는 자신감은 어느 정도인가요?",
  coherence: "내 가치와 원하는 삶에 얼마나 맞나요?",
};

export function PieceEditor({
  piece,
  save,
  remove,
  duplicate,
  close,
}: {
  piece: Piece;
  save: (piece: Piece) => void;
  remove?: () => void;
  duplicate?: () => void;
  close: () => void;
}) {
  const [value, setValue] = useState(piece);
  return (
    <Modal title={remove ? "활동 수정" : "활동 추가"} close={close}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save({ ...value, title: value.title.trim() });
        }}
      >
        <label className="field" htmlFor="piece-title">
          활동 제목
        </label>
        <input
          id="piece-title"
          required
          maxLength={100}
          value={value.title}
          onChange={(e) => setValue({ ...value, title: e.target.value })}
        />
        <label className="field" htmlFor="piece-description">
          설명 (선택)
        </label>
        <textarea
          id="piece-description"
          rows={3}
          maxLength={2000}
          value={value.description}
          onChange={(e) => setValue({ ...value, description: e.target.value })}
        />
        <label className="field" htmlFor="category">
          카테고리
        </label>
        <select
          id="category"
          value={value.category}
          onChange={(e) =>
            setValue({ ...value, category: e.target.value as Category })
          }
        >
          {Object.entries(categories).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <div className="form-grid">
          <div>
            <label className="field" htmlFor="start">
              시작 월
            </label>
            <input
              id="start"
              type="number"
              min={1}
              max={60}
              required
              value={value.start + 1}
              onChange={(e) => {
                const start = Math.max(
                  0,
                  Math.min(59, Number(e.target.value) - 1),
                );
                setValue({
                  ...value,
                  start,
                  duration: Math.min(value.duration, 60 - start),
                });
              }}
            />
          </div>
          <div>
            <label className="field" htmlFor="duration">
              기간 (개월)
            </label>
            <input
              id="duration"
              type="number"
              min={1}
              max={60 - value.start}
              required
              value={value.duration}
              onChange={(e) =>
                setValue({ ...value, duration: Number(e.target.value) })
              }
            />
          </div>
        </div>
        <div className="sheet-footer">
          {remove && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("이 활동을 삭제할까요?")) remove();
              }}
            >
              삭제
            </button>
          )}
          {duplicate && (
            <button type="button" onClick={duplicate}>
              복제
            </button>
          )}
          <button
            className="primary"
            type="submit"
            disabled={!value.title.trim()}
          >
            저장
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PlanEditor({
  plan,
  save,
  close,
}: {
  plan: Plan;
  save: (plan: Plan) => void;
  close: () => void;
}) {
  const [title, setTitle] = useState(plan.title),
    [description, setDescription] = useState(plan.description);
  return (
    <Modal title="플랜 수정" close={close}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save({ ...plan, title: title.trim(), description });
        }}
      >
        <p className="muted">{plan.kind}</p>
        <label className="field" htmlFor="plan-title">
          제목
        </label>
        <input
          id="plan-title"
          required
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="field" htmlFor="plan-description">
          설명
        </label>
        <textarea
          id="plan-description"
          rows={5}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="sheet-footer">
          <button className="primary" disabled={!title.trim()} type="submit">
            저장
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function RatingEditor({
  plan,
  save,
  close,
}: {
  plan: Plan;
  save: (scores: Plan["scores"]) => void;
  close: () => void;
}) {
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    resources: 5,
    appeal: 5,
    confidence: 5,
    coherence: 5,
    ...plan.scores,
  });
  return (
    <Modal title="자가평가" close={close}>
      <p className="sheet-copy">
        AI의 평가가 아니라, 내가 느끼는 정도를 표시합니다.
      </p>
      {Object.entries(ratingLabels).map(([key, label]) => (
        <div className="rating-field" key={key}>
          <label htmlFor={`score-${key}`}>
            {label} · {scores[key as ScoreKey]}
          </label>
          <p>{ratingHelp[key as ScoreKey]}</p>
          <input
            id={`score-${key}`}
            type="range"
            min={0}
            max={10}
            step={1}
            value={scores[key as ScoreKey]}
            onChange={(e) =>
              setScores({ ...scores, [key]: Number(e.target.value) })
            }
          />
        </div>
      ))}
      <div className="sheet-footer">
        <button type="button" onClick={() => save({})}>
          평가 초기화
        </button>
        <button type="button" className="primary" onClick={() => save(scores)}>
          저장
        </button>
      </div>
    </Modal>
  );
}

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
  const [active, setActive] = useState(0),
    [piece, setPiece] = useState<Piece | null>(null);
  const [editing, setEditing] = useState<"plan" | "rating" | null>(null);
  const [exporting, setExporting] = useState(false),
    [error, setError] = useState("");
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
          <p className="plan-kind">{plan.kind}</p>
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
            <div className="rating-grid">
              {Object.entries(ratingLabels).map(([key, label]) => (
                <div key={key} className="rating-value">
                  {label}{" "}
                  <strong>{plan.scores[key as ScoreKey] ?? "미평가"}</strong>
                  <div className="rating-meter">
                    <span
                      style={{
                        width: `${(plan.scores[key as ScoreKey] ?? 0) * 10}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <button
            type="button"
            className="wide space"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              setError("");
              try {
                await exportTimeline(
                  plan.pieces,
                  `${planner.name}-${String.fromCharCode(65 + active)}`,
                );
              } catch (cause) {
                setError((cause as Error).message);
              } finally {
                setExporting(false);
              }
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
    </>
  );
}
