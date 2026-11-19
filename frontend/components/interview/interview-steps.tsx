export function InterviewSteps({ current }: { current: number }) {
  return (
    <nav className="mb-7" aria-label="플래너 만들기 단계">
      <ol className="m-0 grid list-none grid-cols-3 gap-1.5 p-0">
        {["인터뷰", "답변 정리", "플래너 생성"].map((label, i) => (
          <li
            key={label}
            aria-current={i === current ? "step" : undefined}
            className={`flex items-center justify-center gap-2 whitespace-nowrap border px-1 py-3 text-[13px] ${i === current ? "border-[#222] bg-[#222] text-white [font-weight:650]" : "border-[#d4d4d4] bg-[#f3f3f3]"}`}
          >
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
    </nav>
  );
}
