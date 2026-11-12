const steps = [
  {
    title: "음성으로 답하기",
    description: "AI 질문에 현재 생활, 바람, 현실적인 여건을 이야기합니다.",
  },
  {
    title: "세 가지 계획 살펴보기",
    description: "AI가 정리한 세 경로를 탭으로 오가며 검토합니다.",
  },
  {
    title: "내 계획으로 수정하기",
    description: "활동을 추가·수정하고 원한다면 네 관점으로 직접 평가합니다.",
  },
];

export default function UsageSteps() {
  return (
    <section
      className="mt-7 border-t border-(--line) pt-(--space-6)"
      aria-labelledby="usage-steps-heading"
    >
      <h2 id="usage-steps-heading" className="mb-3.5">
        이용 과정
      </h2>
      <ol className="list-none divide-y divide-[#e5e5e5]" role="list">
        {steps.map(({ title, description }, index) => (
          <li
            key={title}
            className="grid grid-cols-[25px_minmax(0,1fr)] gap-2.5 py-3.5"
          >
            <span className="pt-[3px] text-[12px] text-(--muted)">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3>{title}</h3>
              <p className="mt-1 text-[14px] text-(--muted)">{description}</p>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="primary wide space"
        aria-label="하단에서 시작하기"
      >
        시작하기
      </button>
    </section>
  );
}
