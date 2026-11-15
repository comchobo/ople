import {
  buttonClass,
  focusClass,
  primaryButtonClass,
  textButtonClass,
} from "./ui-styles";

type PlannerSummary = {
  id: string;
  name: string;
  createdAt: string;
};

const creationTime = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function PlannerList({ planners }: { planners: PlannerSummary[] }) {
  return (
    <>
      <p className="shrink-0 pb-3 text-[13px] text-[#666]">
        {`총 ${planners.length}개 · 최신 생성순`}
      </p>
      <ul
        aria-label="저장한 플래너"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Independent scroll regions need keyboard access.
        tabIndex={0}
        className={`min-h-0 flex-1 list-none overflow-auto overscroll-contain border-t border-[#d4d4d4] pr-2 [scrollbar-color:#aaa_#f3f3f3] [scrollbar-width:thin] ${focusClass}`}
      >
        {planners.map((planner) => (
          <li
            key={planner.id}
            className="flex flex-wrap items-center justify-between gap-6 border-b border-[#d4d4d4] py-[22px] sm:flex-nowrap"
          >
            <div className="min-w-0 flex-1">
              <h2 className="text-[20px] leading-[1.45] font-[650] tracking-[-0.5px]">
                <button
                  type="button"
                  disabled
                  aria-label={`${planner.name} 열기`}
                  className={`${buttonClass} max-w-full border-transparent p-2 text-left [overflow-wrap:anywhere]`}
                >
                  {planner.name}
                </button>
              </h2>
              <p className="mx-2 text-[13px] text-[#666]">
                <time dateTime={planner.createdAt}>
                  {creationTime.format(new Date(planner.createdAt))}
                </time>
                {" 생성 · 계획 3개"}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled
                className={buttonClass}
                aria-label={`${planner.name} 이름 변경`}
              >
                이름 변경
              </button>
              <button
                type="button"
                disabled
                className={textButtonClass}
                aria-label={`${planner.name} 삭제`}
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export function PlannersView({ planners }: { planners: PlannerSummary[] }) {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="mb-7 flex shrink-0 flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1
            className="text-[30px] leading-[1.35] font-[650] tracking-[-1px] text-balance focus:outline-none"
            tabIndex={-1}
          >
            내 플래너
          </h1>
          <p className="mt-2 text-[#666]">
            서로 다른 고민을 플래너로 나누고, 각각의 Plan A/B/C를 살펴보세요.
          </p>
        </div>
        <button
          type="button"
          disabled
          className={`${primaryButtonClass} shrink-0`}
        >
          새 플래너 만들기
        </button>
      </header>
      {planners.length ? (
        <PlannerList planners={planners} />
      ) : (
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-auto p-8 text-center">
          <h2 className="text-[20px] leading-[1.45] font-[650] tracking-[-0.5px]">
            아직 플래너가 없습니다
          </h2>
          <p className="max-w-[48ch] text-[#666]">
            새 플래너 만들기를 눌러 인터뷰를 시작해보세요. 한 번의 인터뷰로 세
            가지 계획을 만들고, 다음 고민은 새 플래너에 담을 수 있습니다.
          </p>
        </section>
      )}
    </section>
  );
}
