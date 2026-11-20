export function Intro({ start }: { start: () => void }) {
  return (
    <div className="grid h-full grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="min-w-0 overflow-auto p-8">
        <div>
          <p className="mb-6 max-w-[65ch] text-[12px] text-[#555]">
            ODYSSEY PLANNING
          </p>
          <h1 className="mb-[18px] text-[36px] leading-[1.35] tracking-[-1px] [font-weight:650] text-balance">
            하나의 정답 대신,
            <br />세 가지 삶의 가능성
          </h1>
          <p className="mb-6 max-w-[65ch] text-[#555]">
            앞으로의 5년, 어떤 삶을 살고 싶나요? 지금의 나에서 출발해 서로 다른
            미래를 그리고, 작은 실험으로 가능성을 탐색해보세요.
          </p>
          <button
            type="button"
            className="min-h-11 min-w-[200px] cursor-pointer rounded-[3px] border border-[#222] bg-[#222] px-3.5 py-[9px] leading-[1.4] text-white hover:border-[#999] hover:bg-[#444] hover:text-white focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
            onClick={start}
          >
            나의 플래너 시작하기
          </button>
        </div>
        <section className="mt-7 border-t border-[#d4d4d4] pt-6">
          <h2 className="mb-3.5 text-xl leading-[1.45] tracking-[-0.5px] [font-weight:650]">
            인생에는 여러 가지 좋은 길이 있습니다
          </h2>
          <p className="mb-[18px] max-w-[65ch] text-[#555]">
            오디세이 플래닝은 서로 다른 세 가지 5년 계획을 그리며 원하는 삶을
            탐색하는 방법입니다. 일뿐 아니라 창작, 관계, 휴식을 함께 생각합니다.
          </p>
          {[
            [
              "A",
              "현재 방향을 발전시키는 계획",
              "지금의 삶에서 소중한 것을 지키며 더 나은 방향으로 이어갑니다.",
            ],
            [
              "B",
              "다른 방향을 탐색하는 계획",
              "지금의 길을 갈 수 없다면, 또 어떤 가능성이 있을까요?",
            ],
            [
              "C",
              "원하는 삶에서 출발하는 계획",
              "돈이나 타인의 시선에서 한 걸음 떨어져 원하는 모습을 그립니다.",
            ],
          ].map(([number, title, description]) => (
            <div
              className={`grid grid-cols-[25px_1fr] gap-2.5 py-3.5${number === "A" ? "" : " border-t border-[#e5e5e5]"}`}
              key={number}
            >
              <span className="pt-[3px] text-[12px] text-[#666]">{number}</span>
              <div>
                <h3 className="text-base leading-[1.6] [font-weight:650]">
                  {title}
                </h3>
                <p className="mt-1 text-[14px] text-[#666]">{description}</p>
              </div>
            </div>
          ))}
        </section>
        <section className="mt-7 border-t border-[#d4d4d4] pt-6">
          <h2 className="mb-3.5 text-xl leading-[1.45] tracking-[-0.5px] [font-weight:650]">
            말로 풀고, 눈으로 보고, 직접 바꿔보세요
          </h2>
          <p className="mb-[18px] max-w-[65ch] text-[#555]">
            10개의 질문에 답하면 AI가 이야기를 정리하고 세 가지 계획을 만듭니다.
            활동을 더하고 옮기면서 나만의 계획으로 발전시킬 수 있습니다.
          </p>
        </section>
      </section>
      <section className="min-w-0 overflow-auto border-l border-[#d4d4d4] p-7">
        <h2 className="text-xl leading-[1.45] tracking-[-0.5px] [font-weight:650]">
          결과 예시
        </h2>
        <p className="mt-6 text-[12px] text-[#666]">
          일을 이어가며 생활의 여유 만들기
        </p>
        <div className="mt-6 border border-[#d4d4d4] p-4">
          <div className="mt-[18px] mb-3 flex justify-between text-[11px] text-[#666]">
            <span>1년차</span>
            <span>3년차</span>
            <span>5년차</span>
          </div>
          {[
            ["업무 경계 정하기", "0%", "30%"],
            ["주말 창작 활동", "10%", "50%"],
            ["가까운 사람들과 시간", "0%", "100%"],
            ["다른 지역에서 한 달 살기", "65%", "20%"],
          ].map(([label, left, width]) => (
            <div className="mt-[9px] text-[12px]" key={label}>
              {label}
              <div
                className="mt-[5px] h-[9px] bg-[#aaa]"
                style={{ marginLeft: left, width }}
              />
            </div>
          ))}
        </div>
        <section className="mt-7 border-t border-[#d4d4d4] pt-6">
          <h2 className="mb-3.5 text-xl leading-[1.45] tracking-[-0.5px] [font-weight:650]">
            이렇게 진행해요
          </h2>
          <div className="grid grid-cols-[25px_1fr] gap-2.5 py-3.5">
            <span>01</span>
            <div>
              <h3 className="text-base leading-[1.6] [font-weight:650]">
                나의 이야기
              </h3>
              <p className="mt-1 text-[14px] text-[#666]">
                음성으로 질문에 답합니다.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-[25px_1fr] gap-2.5 py-3.5 border-t border-[#e5e5e5]">
            <span>02</span>
            <div>
              <h3 className="text-base leading-[1.6] [font-weight:650]">
                세 가지 미래
              </h3>
              <p className="mt-1 text-[14px] text-[#666]">
                나의 답변으로 서로 다른 계획을 만듭니다.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-[25px_1fr] gap-2.5 py-3.5 border-t border-[#e5e5e5]">
            <span>03</span>
            <div>
              <h3 className="text-base leading-[1.6] [font-weight:650]">
                작은 실험부터
              </h3>
              <p className="mt-1 text-[14px] text-[#666]">
                타임라인을 편집하고 먼저 해볼 일을 찾습니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mt-6 min-h-11 w-full cursor-pointer rounded-[3px] border border-[#222] bg-[#222] px-3.5 py-[9px] leading-[1.4] text-white hover:border-[#999] hover:bg-[#444] hover:text-white focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
            onClick={start}
          >
            시작하기
          </button>
        </section>
      </section>
    </div>
  );
}
