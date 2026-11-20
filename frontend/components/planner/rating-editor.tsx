"use client";

import { useState } from "react";
import type { Plan, ScoreKey } from "@/api/core";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";

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
    <div className="mt-3 grid grid-cols-2 gap-2.5">
      {Object.entries(ratingLabels).map(([key, label]) => (
        <div
          key={key}
          className="border border-rule bg-paper-raised p-2.5 text-[12px]"
          data-score={key}
        >
          <div className="flex items-baseline justify-between gap-2">
            {label}{" "}
            <strong className="text-[16px] font-bold tracking-[-0.03em]">
              {scores[key as ScoreKey] ?? "미평가"}
            </strong>
          </div>
          <div className="mt-2 h-[3px] bg-paper-deep">
            <span
              className="block h-full bg-ink"
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
      <p className="mb-5 max-w-[42ch] text-[14px] leading-relaxed text-muted">
        AI의 평가가 아니라, 내가 느끼는 정도를 표시합니다.
      </p>
      {Object.entries(ratingLabels).map(([key, label]) => (
        <div className="mt-5 border-t border-rule pt-4" key={key}>
          <div className="flex items-baseline justify-between gap-3">
            <label
              className="text-[15px] font-semibold"
              htmlFor={`score-${key}`}
            >
              {label} · {scores[key as ScoreKey]}
            </label>
            <span className="font-mono text-[11px] text-muted">/ 10</span>
          </div>
          <p className="mt-1 mb-2 text-[12px] leading-relaxed text-muted">
            {ratingHelp[key as ScoreKey]}
          </p>
          <input
            className="min-h-11 w-full accent-b focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink"
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
      <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
        <Button variant="secondary" onClick={() => save({})}>
          평가 초기화
        </Button>
        <Button
          variant="primary"
          className="ml-auto"
          onClick={() => save(scores)}
        >
          저장
        </Button>
      </div>
    </Modal>
  );
}
