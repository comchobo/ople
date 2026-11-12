"use client";

import { useStartActions } from "../components/common/AppShell";
import StartButton from "../components/common/StartButton";
import TimelineExample from "./timeline-example";
import UsageSteps from "./usage-steps";

const plans = [
  {
    label: "Plan A",
    title: "현재 방향을 발전시키면",
    description: "지금의 일과 생활을 이어가며 개선하는 계획",
  },
  {
    label: "Plan B",
    title: "다른 방향을 탐색하면",
    description: "지금과 다른 일이나 생활 방식을 시도하는 계획",
  },
  {
    label: "Plan C",
    title: "원하는 삶에서 출발하면",
    description: "해보고 싶은 삶을 중심에 두고 가능한 시도로 구체화한 계획",
  },
];

export default function Home() {
  const startActions = useStartActions();
  return (
    <main className="page-content grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] overflow-hidden p-0">
      <section
        className="min-h-0 min-w-0 overflow-y-auto p-8 [scrollbar-color:#aaa_var(--soft)] [scrollbar-width:thin]"
        aria-label="서비스 소개"
      >
        <div>
          <h1 className="mb-[18px] text-[36px]">
            앞으로 5년,
            <br />세 가지 계획으로 살펴보기
          </h1>
          <p className="mb-6 max-w-[65ch] text-[#555]">
            AI와의 음성 인터뷰로 생각을 정리하고,
            <br />
            서로 다른 삶의 계획을 비교·수정합니다.
          </p>
          <StartButton {...startActions} className="primary min-w-[200px]" />
        </div>
        <section
          className="mt-7 border-t border-(--line) pt-(--space-6)"
          aria-labelledby="plans-heading"
        >
          <h2 id="plans-heading" className="mb-3.5">
            왜 세 가지 계획인가요?
          </h2>
          <p className="max-w-[65ch] text-[#555]">
            오디세이 플래닝은 하나의 미래를 정답으로 고르는 대신, 서로 다른 세
            가지 미래를 구체적으로 그려보는 방법입니다.
          </p>
          <p className="mt-[18px] max-w-[65ch] text-[#555]">
            일뿐 아니라 창작, 관계, 휴식을 함께 놓고 각 계획이 내 관심과 여건에
            어떻게 맞는지 살펴봅니다.
          </p>
          <ul className="list-none divide-y divide-[#e5e5e5]" role="list">
            {plans.map(({ label, title, description }) => (
              <li
                key={label}
                className="grid grid-cols-[44px_minmax(0,1fr)] gap-2.5 py-3.5"
              >
                <span className="pt-[3px] text-[12px] text-(--muted)">
                  {label}
                </span>
                <div>
                  <h3>{title}</h3>
                  <p className="mt-1 text-[14px] text-(--muted)">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </section>
      <div className="min-h-0 min-w-0 overflow-y-auto border-l border-(--line) p-7 [scrollbar-color:#aaa_var(--soft)] [scrollbar-width:thin]">
        <TimelineExample />
        <UsageSteps
          startButton={
            <StartButton
              {...startActions}
              className="primary wide space"
              aria-label="하단에서 시작하기"
            />
          }
        />
      </div>
    </main>
  );
}
