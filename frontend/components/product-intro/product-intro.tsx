import PlanResultExample from "./plan-result-example";
import StartButton from "./start-button";
import UsageSteps from "./usage-steps";

const plans = [
  {
    name: "Plan A",
    title: "현재 방향을 발전시키기",
    description: "지금의 일과 생활을 이어가며 개선할 점을 찾아봅니다.",
  },
  {
    name: "Plan B",
    title: "다른 방향을 탐색하기",
    description: "지금과 다른 일이나 생활 방식을 시도하는 모습을 그려봅니다.",
  },
  {
    name: "Plan C",
    title: "원하는 삶에서 출발하기",
    description:
      "해보고 싶은 삶을 그려보고, 그 삶에 가까워질 방법을 찾아봅니다.",
  },
];

export default function ProductIntro() {
  return (
    <main className="mx-auto grid w-full max-w-[74.625rem] break-keep text-neutral-800 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="min-w-0 p-6 lg:p-8">
        <header>
          <h1 className="max-w-[15ch] text-[clamp(2rem,4.5vw,3rem)] leading-tight font-bold">
            앞으로 5년, 세 가지 계획으로 살펴보기
          </h1>
          <p className="mt-4 max-w-[38rem] leading-relaxed text-neutral-600">
            AI와의 음성 인터뷰로 생각을 정리하고, 서로 다른 삶의 계획을 비교하고
            수정합니다.
          </p>
          <StartButton placement="top" />
        </header>

        <section
          className="mt-8 border-t border-neutral-300 pt-6"
          aria-labelledby="plan-heading"
        >
          <h2 id="plan-heading" className="text-[1.375rem] font-bold">
            왜 세 가지 계획인가요?
          </h2>
          <p className="mt-4 max-w-[38rem] leading-relaxed text-neutral-600">
            오디세이 플래닝은 앞으로 5년 동안 살아볼 수 있는 세 가지 삶을
            구체적으로 그려보는 방법입니다. 일, 창작, 관계, 휴식을 함께 생각하며
            각 계획이 내 관심과 여건에 얼마나 맞는지 살펴봅니다.
          </p>
          <dl className="mt-6">
            {plans.map(({ name, title, description }) => (
              <div key={name} className="border-t border-neutral-200 py-3.5">
                <dt className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-sm text-neutral-600">{name}</span>
                  <strong>{title}</strong>
                </dt>
                <dd className="mt-1 leading-relaxed text-neutral-600">
                  {description}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <div className="min-w-0 border-t border-neutral-300 p-6 lg:border-t-0 lg:border-l lg:p-7">
        <PlanResultExample />
        <UsageSteps />
      </div>
    </main>
  );
}
