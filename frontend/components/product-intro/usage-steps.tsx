import StartButton from "./start-button";

const steps = [
  {
    title: "음성으로 답하기",
    description: "AI 질문에 현재 생활, 바람, 현실적인 여건을 이야기합니다.",
  },
  {
    title: "세 가지 계획 살펴보기",
    description: "AI가 정리한 세 가지 계획을 탭으로 오가며 살펴봅니다.",
  },
  {
    title: "내 계획으로 수정하기",
    description:
      "활동을 추가하거나 수정하고, 원한다면 네 가지 관점에서 직접 평가합니다.",
  },
];

export default function UsageSteps() {
  return (
    <section
      aria-labelledby="usage-heading"
      className="mt-8 border-t border-neutral-300 pt-6"
    >
      <h2 id="usage-heading" className="text-[1.375rem] font-bold">
        이용 과정
      </h2>
      <ol className="mt-4 space-y-4">
        {steps.map(({ title, description }, index) => (
          <li key={title} className="flex gap-3">
            <span
              aria-hidden="true"
              className="shrink-0 pt-0.5 text-sm tabular-nums text-neutral-600"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="font-bold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                {description}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <StartButton placement="bottom" />
    </section>
  );
}
