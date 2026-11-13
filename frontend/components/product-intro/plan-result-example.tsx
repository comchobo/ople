const activities = [
  { label: "일 · 전문 역량 넓히기", position: "col-start-3 col-span-5" },
  { label: "창작 · 주말 제작 모임", position: "col-start-1 col-span-3" },
  { label: "관계 · 정기적인 만남", position: "col-start-1 col-span-10" },
  { label: "휴식 · 한 달 지역 살기", position: "col-start-7 col-span-2" },
];

const monthFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
});

export default function PlanResultExample() {
  const parts = monthFormatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = parts.find((part) => part.type === "month")?.value;
  const years = Array.from({ length: 5 }, (_, index) => year + index);

  return (
    <section aria-labelledby="plan-result-heading">
      <h2 id="plan-result-heading" className="text-[1.375rem] font-bold">
        결과는 이렇게 정리됩니다
      </h2>
      <p className="mt-4 leading-relaxed text-neutral-600">
        각 계획에는 설명과 5년 타임라인이 담깁니다. 활동의 내용과 시점은 직접
        바꿀 수 있습니다.
      </p>

      <div className="mt-4 border border-neutral-300 p-4">
        <h3 className="font-bold">Plan A · 결과 예시</h3>
        <p className="mt-1 text-sm text-neutral-600">
          일을 이어가며 생활의 여유 만들기
        </p>
        <ul
          className="mt-4 mb-3 flex justify-between gap-1 text-[11px] tabular-nums text-neutral-600"
          aria-label="5년 타임라인"
        >
          {years.map((value) => (
            <li key={value}>
              <time dateTime={`${value}-${month}`}>
                {value}.{month}
              </time>
            </li>
          ))}
        </ul>

        <ul className="space-y-2.5">
          {activities.map(({ label, position }) => (
            <li key={label} className="text-xs">
              {label}
              <div className="mt-1 grid grid-cols-10" aria-hidden="true">
                <div className={`h-2.25 bg-neutral-400 ${position}`} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
