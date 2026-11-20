export function InterviewSteps({ current }: { current: number }) {
  return (
    <nav className="mb-8 border-y border-ink" aria-label="플래너 만들기 단계">
      <ol className="m-0 grid list-none grid-cols-3 p-0">
        {["인터뷰", "답변 정리", "플래너 생성"].map((label, i) => (
          <li
            key={label}
            aria-current={i === current ? "step" : undefined}
            className={`flex min-h-11 items-center gap-2 border-l border-rule px-2 py-3 text-[11px] first:border-l-0 md:gap-3 md:px-3 md:text-[12px] ${
              i === current
                ? "border-t-2 border-t-c bg-paper-raised font-bold text-ink"
                : "text-muted"
            }`}
          >
            <span className="font-sans text-[10px] font-bold tracking-[0.08em] tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            {label}
          </li>
        ))}
      </ol>
    </nav>
  );
}
