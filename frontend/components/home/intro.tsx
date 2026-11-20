import { ArrowRight } from "lucide-react";
import { Button } from "@/components/button";

const plans = [
  {
    letter: "A",
    text: "text-a",
    bar: "bg-a",
    soft: "bg-a-soft",
    title: "현재 방향을 발전시키는 계획",
    description:
      "지금의 삶에서 소중한 것을 지키며 더 나은 방향으로 이어갑니다.",
    bars: [
      [0, 18],
      [26, 24],
      [56, 30],
    ],
  },
  {
    letter: "B",
    text: "text-b",
    bar: "bg-b",
    soft: "bg-b-soft",
    title: "다른 방향을 탐색하는 계획",
    description: "지금의 길을 갈 수 없다면, 또 어떤 가능성이 있을까요?",
    bars: [
      [8, 34],
      [48, 22],
      [74, 20],
    ],
  },
  {
    letter: "C",
    text: "text-c",
    bar: "bg-c",
    soft: "bg-c-soft",
    title: "원하는 삶에서 출발하는 계획",
    description:
      "돈이나 타인의 시선에서 한 걸음 떨어져 원하는 모습을 그립니다.",
    bars: [
      [0, 14],
      [20, 28],
      [56, 36],
    ],
  },
] as const;

const steps = [
  {
    number: "01",
    title: "나의 이야기",
    description: "10개의 질문에 음성으로 답합니다.",
  },
  {
    number: "02",
    title: "세 가지 미래",
    description: "나의 답변으로 서로 다른 계획을 만듭니다.",
  },
  {
    number: "03",
    title: "작은 실험부터",
    description: "타임라인을 편집하고 먼저 해볼 일을 찾습니다.",
  },
] as const;

export function Intro({ start }: { start: () => void }) {
  return (
    <div className="page-shell pb-16 pt-6 md:pt-10">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink pb-3">
        <span className="folio">Odyssey Planning · Issue 01</span>
        <span className="folio">2026–2031 · 60 Months</span>
      </div>

      <section className="grid gap-10 pt-8 md:grid-cols-12 md:gap-6 md:pt-12 lg:gap-10">
        <div className="md:col-span-7">
          <h1 className="text-display font-extrabold text-balance">
            하나의 정답 대신,
            <br />세 가지 삶의 가능성
          </h1>
          <p className="mt-7 max-w-[34em] font-serif text-deck text-ink-soft">
            앞으로의 5년, 어떤 삶을 살고 싶나요? 지금의 나에서 출발해 서로 다른
            미래를 그리고, 작은 실험으로 가능성을 탐색해보세요.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button variant="primary" className="px-6" onClick={start}>
              나의 플래너 시작하기
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
            <p className="max-w-[18em] text-[12px] leading-relaxed text-muted">
              10개의 질문 · 세 가지 5년 계획
              <br />
              목소리로 시작하는 자기탐색
            </p>
          </div>
          <dl className="mt-10 grid max-w-[34rem] grid-cols-3 gap-4 border-t border-rule pt-4">
            <div>
              <dt className="folio">Questions</dt>
              <dd className="mt-1 text-[28px] leading-none font-bold tracking-[-0.04em]">
                10
              </dd>
            </div>
            <div>
              <dt className="folio">Futures</dt>
              <dd className="mt-1 text-[28px] leading-none font-bold tracking-[-0.04em]">
                3
              </dd>
            </div>
            <div>
              <dt className="folio">Horizon</dt>
              <dd className="mt-1 text-[28px] leading-none font-bold tracking-[-0.04em]">
                5년
              </dd>
            </div>
          </dl>
        </div>

        <aside className="border border-ink bg-paper-raised md:col-span-5">
          <div className="flex items-end justify-between border-b border-rule px-5 py-4">
            <p className="text-[17px] font-bold">세 가지 계획</p>
            <p className="text-right text-[11px] leading-tight text-muted">
              5 years
              <br />
              60 months
            </p>
          </div>
          <div className="px-5">
            {plans.map((plan) => (
              <article
                className="border-b border-rule py-4 last:border-b-0"
                key={plan.letter}
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className={`font-sans text-[11px] font-bold ${plan.text}`}
                  >
                    {plan.letter}
                  </span>
                  <h2 className="text-[15px] leading-snug font-bold">
                    {plan.title}
                  </h2>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                  {plan.description}
                </p>
                <div
                  className={`relative mt-3 h-2 overflow-hidden ${plan.soft}`}
                  aria-hidden="true"
                >
                  {plan.bars.map(([left, width]) => (
                    <span
                      className={`absolute top-0 h-full ${plan.bar}`}
                      key={`${plan.letter}-${left}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-muted">
                  <span>2026</span>
                  <span>2031</span>
                </div>
              </article>
            ))}
          </div>
          <p className="border-t border-rule px-5 py-3 text-[10px] leading-relaxed text-muted">
            세 가지 예시 · 실제 사용자의 기록이 아닙니다
          </p>
        </aside>
      </section>

      <section className="mt-14 border-t border-ink pt-8 md:mt-20 md:pt-10">
        <div className="grid gap-8 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <h2 className="text-title font-extrabold text-balance">
              인생에는 여러 가지 좋은 길이 있습니다
            </h2>
            <p className="mt-5 max-w-[30em] text-[15px] leading-relaxed text-ink-soft">
              오디세이 플래닝은 서로 다른 세 가지 5년 계획을 그리며 원하는 삶을
              탐색하는 방법입니다. 일뿐 아니라 창작, 관계, 휴식을 함께
              생각합니다.
            </p>
          </div>
          <div className="md:col-span-8">
            {plans.map((plan) => (
              <div
                className="grid grid-cols-[34px_1fr] gap-4 border-t border-rule py-6 first:border-t-0 md:grid-cols-[54px_1fr]"
                key={plan.letter}
              >
                <span
                  className={`font-sans text-[13px] font-bold ${plan.text}`}
                >
                  {plan.letter}
                </span>
                <div>
                  <h3 className="text-[20px] leading-snug font-bold tracking-[-0.03em] md:text-[24px]">
                    {plan.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted md:text-[15px]">
                    {plan.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14 border-t border-ink pt-8 md:mt-20 md:pt-10">
        <div className="grid gap-8 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <h2 className="text-title font-extrabold text-balance">
              말로 풀고,
              <br />
              눈으로 보고,
              <br />
              직접 바꿔보세요
            </h2>
            <p className="mt-5 max-w-[30em] font-serif text-[17px] leading-[1.8] text-ink-soft">
              10개의 질문에 답하면 AI가 이야기를 정리하고 세 가지 계획을
              만듭니다. 활동을 더하고 옮기면서 나만의 계획으로 발전시킬 수
              있습니다.
            </p>
          </div>
          <div className="md:col-span-7">
            <div className="border-t border-ink">
              {steps.map((step) => (
                <div
                  className="grid grid-cols-[48px_1fr] gap-4 border-b border-rule py-5 md:grid-cols-[70px_1fr]"
                  key={step.number}
                >
                  <span className="font-sans text-[11px] tracking-[0.08em] tabular-nums text-muted">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-[18px] font-bold tracking-[-0.02em]">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <p className="max-w-[22em] text-[12px] leading-relaxed text-muted">
                기존 플래너는 그대로 유지됩니다. 중단한 인터뷰는 이어할 수
                없습니다.
              </p>
              <Button variant="primary" className="px-6" onClick={start}>
                시작하기
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
