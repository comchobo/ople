const years = [2026, 2027, 2028, 2029, 2030];

const activities = [
  { label: "일 · 전문 역량 넓히기", bar: "ml-[20%] w-1/2" },
  { label: "창작 · 주말 제작 모임", bar: "w-[30%]" },
  { label: "관계 · 정기적인 만남", bar: "w-full" },
  { label: "휴식 · 한 달 지역 살기", bar: "ml-[60%] w-1/5" },
];

export default function TimelineExample() {
  return (
    <section aria-labelledby="timeline-example-heading">
      <h2 id="timeline-example-heading" className="mb-3.5">
        결과는 이렇게 정리됩니다
      </h2>
      <p className="mb-[18px] text-[#555]">
        각 계획에는 설명과 5년 타임라인이 담깁니다. 활동의 내용과 시점은 직접
        바꿀 수 있습니다.
      </p>
      <figure className="overflow-x-auto border border-(--line) p-4">
        <figcaption>
          <h3>Plan A · 결과 예시</h3>
          <p className="small">일을 이어가며 생활의 여유 만들기</p>
        </figcaption>
        <div className="min-w-[200px]">
          <div className="mt-[18px] mb-3 flex justify-between text-[11px] text-(--muted)">
            {years.map((year) => (
              <time key={year} dateTime={`${year}-11`}>
                {year}.11
              </time>
            ))}
          </div>
          <ul className="list-none" role="list">
            {activities.map(({ label, bar }) => (
              <li key={label} className="mt-[9px] text-[12px]">
                {label}
                <div
                  aria-hidden="true"
                  className={`mt-[5px] h-[9px] bg-[#aaa] ${bar}`}
                />
              </li>
            ))}
          </ul>
        </div>
      </figure>
    </section>
  );
}
