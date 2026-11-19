"use client";

import { useState } from "react";
import type { Plan, ScoreKey } from "@/api/core";
import { ratingHelp, ratingLabels } from "@/planners/labels";
import { Modal } from "./modal";

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
