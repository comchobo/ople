"use client";

import { useState } from "react";
import type { Plan, ScoreKey } from "@/api/core";
import { Modal } from "./modal";

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

export function RatingSummary({ scores }: { scores: Plan["scores"] }) {
  return (
    <div className="rating-grid">
      {Object.entries(ratingLabels).map(([key, label]) => (
        <div key={key} className="rating-value">
          {label} <strong>{scores[key as ScoreKey] ?? "미평가"}</strong>
          <div className="rating-meter">
            <span
              style={{ width: `${(scores[key as ScoreKey] ?? 0) * 10}%` }}
            />
          </div>
        </div>
      ))}
    </div>
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
