"use client";

import { useAppShell } from "./app-shell";
import { focusClass, primaryButtonClass } from "./ui-styles";

const plans = [
  ["현재 방향을 발전시키면", "지금의 일과 생활을 이어가며 개선하는 계획"],
  ["다른 방향을 탐색하면", "지금과 다른 일이나 생활 방식을 시도하는 계획"],
  [
    "원하는 삶에서 출발하면",
    "해보고 싶은 삶을 중심에 두고 가능한 시도로 구체화한 계획",
  ],
];
const steps = [
  [
    "음성으로 답하기",
    "AI 질문에 현재 생활, 바람, 현실적인 여건을 이야기합니다.",
  ],
  ["세 가지 계획 살펴보기", "AI가 정리한 세 경로를 탭으로 오가며 검토합니다."],
  [
    "내 계획으로 수정하기",
    "활동을 추가·수정하고 원한다면 네 관점으로 직접 평가합니다.",
  ],
];

function NumberedItems({ items }: { items: string[][] }) {
  return items.map(([title, description], index) => (
    <div
      className={`grid grid-cols-[25px_1fr] gap-2.5 py-3.5 ${index > 0 ? "border-t border-[#e5e5e5]" : ""}`}
      key={title}
    >
      <span className="pt-[3px] text-[12px] text-[#666]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div>
        <h3 className="text-[16px] font-[650]">{title}</h3>
        <p className="mt-1 text-[14px] text-[#666]">{description}</p>
      </div>
    </div>
  ));
}

export function IntroView({ dates }: { dates: string[] }) {
  const { start } = useAppShell();
  return (
    <div className="intro-layout grid h-full grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section
        className={`min-w-0 overflow-auto overscroll-contain p-8 [scrollbar-color:#aaa_#f3f3f3] [scrollbar-width:thin] ${focusClass}`}
        aria-label="서비스 소개"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Independent scroll regions need keyboard access.
        tabIndex={0}
      >
        <div>
          <h1
            className="mb-[18px] text-4xl leading-[1.35] font-[650] tracking-[-1px] text-balance focus:outline-none"
            tabIndex={-1}
          >
            앞으로 5년,
            <br />세 가지 계획으로 살펴보기
          </h1>
          <p className="mb-[18px] max-w-[65ch] text-[#555]">
            AI와의 음성 인터뷰로 생각을 정리하고,
            <br />
            서로 다른 삶의 계획을 비교·수정합니다.
          </p>
          <button
            type="button"
            className={`${primaryButtonClass} min-w-[200px]`}
            onClick={start}
          >
            시작하기
          </button>
        </div>
        <div className="not-first:mt-7 not-first:border-t not-first:border-[#d4d4d4] not-first:pt-6">
          <h2 className="mb-3.5 text-[20px] leading-[1.45] font-[650] tracking-[-0.5px]">
            왜 세 가지 계획인가요?
          </h2>
          <p className="mb-[18px] max-w-[65ch] text-[#555]">
            오디세이 플래닝은 하나의 미래를 정답으로 고르는 대신, 서로 다른 세
            가지 미래를 구체적으로 그려보는 방법입니다.
          </p>
          <p className="max-w-[65ch] text-[#555]">
            일뿐 아니라 창작, 관계, 휴식을 함께 놓고 각 계획이 내 관심과 여건에
            어떻게 맞는지 살펴봅니다.
          </p>
          <NumberedItems items={plans} />
        </div>
      </section>
      <section
        className={`min-w-0 overflow-auto overscroll-contain border-l border-[#d4d4d4] p-7 [scrollbar-color:#aaa_#f3f3f3] [scrollbar-width:thin] ${focusClass}`}
        aria-label="결과 예시와 이용 과정"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Independent scroll regions need keyboard access.
        tabIndex={0}
      >
        <div className="not-first:mt-7 not-first:border-t not-first:border-[#d4d4d4] not-first:pt-6">
          <h2 className="mb-3.5 text-[20px] leading-[1.45] font-[650] tracking-[-0.5px]">
            결과는 이렇게 정리됩니다
          </h2>
          <p className="mb-[18px] max-w-[65ch] text-[#555]">
            각 계획에는 설명과 5년 타임라인이 담깁니다. 활동의 내용과 시점은
            직접 바꿀 수 있습니다.
          </p>
          <div className="border border-[#d4d4d4] p-4">
            <h3 className="text-[16px] font-[650]">Plan A · 결과 예시</h3>
            <p className="text-[12px]">일을 이어가며 생활의 여유 만들기</p>
            <div className="mt-[18px] mb-3 flex justify-between text-[11px] text-[#666]">
              {dates.map((date) => (
                <span key={date}>{date}</span>
              ))}
            </div>
            <div className="mt-[9px] text-[12px]">
              일 · 전문 역량 넓히기
              <div
                className="mt-[5px] h-[9px] bg-[#aaa]"
                style={{ marginLeft: "20%", width: "50%" }}
              />
            </div>
            <div className="mt-[9px] text-[12px]">
              창작 · 주말 제작 모임
              <div
                className="mt-[5px] h-[9px] bg-[#aaa]"
                style={{ width: "30%" }}
              />
            </div>
            <div className="mt-[9px] text-[12px]">
              관계 · 정기적인 만남
              <div
                className="mt-[5px] h-[9px] bg-[#aaa]"
                style={{ width: "100%" }}
              />
            </div>
            <div className="mt-[9px] text-[12px]">
              휴식 · 한 달 지역 살기
              <div
                className="mt-[5px] h-[9px] bg-[#aaa]"
                style={{ marginLeft: "60%", width: "20%" }}
              />
            </div>
          </div>
        </div>
        <div className="not-first:mt-7 not-first:border-t not-first:border-[#d4d4d4] not-first:pt-6">
          <h2 className="mb-3.5 text-[20px] leading-[1.45] font-[650] tracking-[-0.5px]">
            이용 과정
          </h2>
          <NumberedItems items={steps} />
          <button
            type="button"
            className={`${primaryButtonClass} mt-6 w-full`}
            aria-label="하단에서 시작하기"
            onClick={start}
          >
            시작하기
          </button>
        </div>
      </section>
    </div>
  );
}
