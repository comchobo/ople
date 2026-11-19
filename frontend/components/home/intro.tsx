import { ArrowRight } from "lucide-react";
import { PlanPreview } from "./plan-preview";

export function Intro({ start }: { start: () => void }) {
  return (
    <>
      <div className="intro-layout">
        <section className="intro-hero">
          <div>
            <h1>
              하나의 정답 대신,
              <br />세 가지 삶의
              <br />
              가능성
            </h1>
            <p className="hero-description">
              앞으로의 5년, 어떤 삶을 살고 싶나요? 지금의 나에서 출발해 서로
              다른 미래를 그리고, 작은 실험으로 가능성을 탐색해보세요.
            </p>
          </div>
          <button type="button" className="primary" onClick={start}>
            나의 플래너 시작하기 <ArrowRight aria-hidden="true" />
          </button>
          <div className="hero-note">
            <strong>나의 삶을 재료로</strong>
            <p>일뿐 아니라 창작, 관계, 휴식을 함께 생각합니다.</p>
          </div>
        </section>
        <PlanPreview />
      </div>
      <section className="intro-method" id="method">
        <div>
          <h2>말로 풀고, 눈으로 보고, 직접 바꿔보세요</h2>
          <p className="method-description">
            10개의 질문에 답하면 AI가 이야기를 정리하고 세 가지 계획을 만듭니다.
            활동을 더하고 옮기면서 나만의 계획으로 발전시킬 수 있습니다.
          </p>
        </div>
        <ol className="method-steps">
          {[
            ["나의 이야기", "음성으로 질문에 답합니다."],
            ["세 가지 미래", "나의 답변으로 서로 다른 계획을 만듭니다."],
            ["작은 실험부터", "타임라인을 편집하고 먼저 해볼 일을 찾습니다."],
          ].map(([title, description], index) => (
            <li key={title}>
              <h3>
                <span>0{index + 1}</span>
                {title}
              </h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="intro-close">
        <div>
          <h3>인생에는 여러 가지 좋은 길이 있습니다</h3>
          <p>
            오디세이 플래닝은 서로 다른 세 가지 5년 계획을 그리며 원하는 삶을
            탐색하는 방법입니다.
          </p>
        </div>
        <button type="button" className="primary" onClick={start}>
          시작하기 <ArrowRight aria-hidden="true" />
        </button>
      </section>
    </>
  );
}
