"use client";

import { useState } from "react";
import type { Plan, ScoreKey } from "@/api/core";
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
          className="border border-[#d4d4d4] p-2 text-[12px]"
          data-score={key}
        >
          {label} <strong>{scores[key as ScoreKey] ?? "미평가"}</strong>
          <div className="mt-[7px] h-[3px] bg-[#eee]">
            <span
              className="block h-full bg-[#777]"
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
      <p className="mb-5 text-[14px] text-[#555]">
        AI의 평가가 아니라, 내가 느끼는 정도를 표시합니다.
      </p>
      {Object.entries(ratingLabels).map(([key, label]) => (
        <div className="mt-[18px] border-t border-[#ddd] pt-4" key={key}>
          <label className="text-[14px] font-semibold" htmlFor={`score-${key}`}>
            {label} · {scores[key as ScoreKey]}
          </label>
          <p className="mt-[3px] mb-2 text-[12px] text-[#666]">
            {ratingHelp[key as ScoreKey]}
          </p>
          <input
            className="min-h-11 w-full accent-[#333] focus:[outline:2px_solid_#555] focus:[outline-offset:1px]"
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
      <div className="mt-6 flex justify-between gap-2 border-t border-[#d4d4d4] pt-4">
        <button
          className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
          type="button"
          onClick={() => save({})}
        >
          평가 초기화
        </button>
        <button
          type="button"
          className="min-h-11 cursor-pointer rounded-[3px] border border-[#222] bg-[#222] px-3.5 py-[9px] leading-[1.4] text-white hover:border-[#999] hover:bg-[#444] hover:text-white focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] ml-auto"
          onClick={() => save(scores)}
        >
          저장
        </button>
      </div>
    </Modal>
  );
}
