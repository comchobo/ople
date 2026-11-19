export function InterviewSteps({ current }: { current: number }) {
  return (
    <nav className="steps" aria-label="플래너 만들기 단계">
      <ol>
        {["인터뷰", "답변 정리", "플래너 생성"].map((label, i) => (
          <li key={label} aria-current={i === current ? "step" : undefined}>
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
    </nav>
  );
}
