"use client";

import { useState } from "react";

const examples = [
  {
    label: "현재의 발전",
    title: "일을 이어가며 생활의 여유 만들기",
    kind: "현재 방향을 발전시키는 계획",
    description:
      "지금의 삶에서 소중한 것을 지키며 더 나은 방향으로 이어갑니다.",
    activities: [
      ["업무 경계 정하기", 0, 30],
      ["주말 창작 활동", 10, 50],
      ["가까운 사람들과 시간", 0, 100],
      ["다른 지역에서 한 달 살기", 65, 20],
    ],
  },
  {
    label: "다른 방향",
    title: "다른 방향을 탐색하는 계획",
    kind: "다른 방향을 탐색하는 계획",
    description: "지금의 길을 갈 수 없다면, 또 어떤 가능성이 있을까요?",
    activities: [
      ["관심 있는 분야 배우기", 0, 25],
      ["새로운 일 작게 시도하기", 20, 35],
      ["새로운 사람들과 연결되기", 10, 75],
      ["나에게 맞는 방향 이어가기", 60, 40],
    ],
  },
  {
    label: "원하는 삶",
    title: "원하는 삶에서 출발하는 계획",
    kind: "원하는 삶에서 출발하는 계획",
    description:
      "돈이나 타인의 시선에서 한 걸음 떨어져 원하는 모습을 그립니다.",
    activities: [
      ["좋아하는 것 기록하기", 0, 20],
      ["나만의 창작 프로젝트", 15, 50],
      ["소중한 관계 돌보기", 0, 100],
      ["살고 싶은 곳에서 지내보기", 60, 30],
    ],
  },
] as const;

export function PlanPreview() {
  const [active, setActive] = useState(0);
  const example = examples[active];
  return (
    <section className="intro-work" id="possibilities" data-plan={active}>
      <div className="work-title">
        <h2>서로 다른 미래를 그려보세요</h2>
        <span className="sample-label">결과 예시</span>
      </div>
      <div className="preview-tabs" role="tablist" aria-label="계획 예시">
        {examples.map((item, index) => (
          <button
            type="button"
            key={item.label}
            id={`preview-tab-${index}`}
            role="tab"
            aria-selected={active === index}
            aria-controls="preview-panel"
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? 2
                    : event.key === "ArrowRight"
                      ? (index + 1) % 3
                      : event.key === "ArrowLeft"
                        ? (index + 2) % 3
                        : null;
              if (next === null) return;
              event.preventDefault();
              setActive(next);
              event.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>("button")
                [next]?.focus();
            }}
          >
            <b>{String.fromCharCode(65 + index)}</b> {item.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="preview-panel"
        aria-labelledby={`preview-tab-${active}`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: A read-only tab panel is focusable per the WAI-ARIA tabs pattern.
        tabIndex={0}
      >
        <div className="example" key={active}>
          <h3>{example.title}</h3>
          <p>{example.description}</p>
          <div className="years">
            {[1, 2, 3, 4, 5].map((year) => (
              <span key={year}>{year}년차</span>
            ))}
          </div>
          {example.activities.map(([title, start, duration]) => (
            <div className="sample-row" key={title}>
              {title}
              <div className="sample-rail">
                <div
                  className="sample-bar"
                  style={{ marginLeft: `${start}%`, width: `${duration}%` }}
                />
              </div>
            </div>
          ))}
          <div className="example-footer">
            <span>5년의 흐름을 한눈에</span>
            <span>활동과 기간은 직접 편집할 수 있어요</span>
          </div>
        </div>
      </div>
      <div className="possibilities">
        {examples
          .filter((_, index) => index !== active)
          .map((item) => (
            <div
              className="alternative"
              key={item.label}
              data-plan={examples.indexOf(item)}
            >
              <b>{String.fromCharCode(65 + examples.indexOf(item))}</b>
              <p>{item.description}</p>
            </div>
          ))}
      </div>
      <p className="intro-note">
        위 타임라인은 이해를 돕기 위한 결과 예시입니다. 나의 답변으로 서로 다른
        계획을 만듭니다.
      </p>
    </section>
  );
}
