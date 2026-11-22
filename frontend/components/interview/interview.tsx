"use client";

import type { Job } from "@/api/core";
import { useInterview } from "@/hooks/interview/use-interview";
import { InterviewSteps } from "./interview-steps";
import { Recorder } from "./recorder";

export function Interview({
  exit,
  generated,
}: {
  exit: () => void;
  generated: (job: Job) => void;
}) {
  const {
    answers,
    question,
    summary,
    phase,
    busy,
    error,
    submit,
    start,
    retry,
    generate,
  } = useInterview(generated);
  return (
    <>
      <InterviewSteps
        current={phase === "summary" ? 1 : phase === "generating" ? 2 : 0}
      />
      {phase === "prepare" ? (
        <section className="mx-auto w-[min(100%,640px)]">
          <h1 className="mb-6 text-center text-[30px] leading-[1.35] tracking-[-1px] [font-weight:650] text-balance">
            나의 가능성을 이야기해보세요
          </h1>
          <p className="text-center">
            10개의 질문에 음성으로 답하면 서로 다른 세 가지 5년 계획을 만듭니다.
          </p>
          <ol className="my-6 list-decimal border border-[#d4d4d4] bg-[#f3f3f3] py-3.5 pr-3.5 pl-[34px] text-[13px]">
            <li>마이크 버튼으로 녹음을 시작하세요.</li>
            <li>일시정지 후 이어서 녹음하거나 답변을 제출하세요.</li>
            <li>
              기존 플래너는 그대로 유지됩니다. 중단한 인터뷰는 이어할 수
              없습니다.
            </li>
            <li>
              녹음 원본은 서버에 영구 보관됩니다. 답변은 Cloudflare 음성 인식과
              Ollama AI 생성에 사용됩니다.
            </li>
          </ol>
          <button
            className="mx-auto mt-6 block w-[240px] min-h-11 cursor-pointer rounded-[3px] border border-[#222] bg-[#222] px-3.5 py-[9px] leading-[1.4] text-white hover:border-[#999] hover:bg-[#444] hover:text-white focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
            disabled={busy}
            onClick={() => void start()}
            type="button"
          >
            {busy ? "질문 생성 중…" : "인터뷰 시작"}
          </button>
        </section>
      ) : phase === "interview" ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl leading-[1.45] tracking-[-0.5px] [font-weight:650]">
                나의 미래를 탐색하는 인터뷰
              </h2>
              <p className="text-[#666]">
                질문 {Math.min(answers.length + 1, 10)} / 10
              </p>
            </div>
            <button
              className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
              type="button"
              onClick={exit}
            >
              나가기
            </button>
          </div>
          <div className="mt-4 flex gap-[5px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
              <span
                key={step}
                className={`h-[3px] flex-1 ${step <= answers.length ? "bg-[#333]" : "bg-[#e5e5e5]"}`}
              />
            ))}
          </div>
          {question ? (
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8">
              <section className="min-w-0 overflow-auto py-6 pr-4">
                <h1 className="max-w-[23ch] text-[32px] leading-[1.35] tracking-[-1px] [font-weight:650] text-balance">
                  {question}
                </h1>
              </section>
              <Recorder key={answers.length} submit={submit} busy={busy} />
            </div>
          ) : (
            <p className="mt-6">
              {busy
                ? "답변을 정리하고 다음 단계를 준비하고 있습니다…"
                : "다음 단계를 다시 요청해주세요."}
            </p>
          )}
        </>
      ) : phase === "summary" ? (
        <section className="mx-auto w-[min(100%,640px)]">
          <h1 className="text-center text-[30px] leading-[1.35] tracking-[-1px] [font-weight:650] text-balance">
            이야기를 정리했어요
          </h1>
          <p className="mt-6 whitespace-pre-wrap border border-[#d4d4d4] bg-[#f3f3f3] p-3.5 text-[13px]">
            {summary}
          </p>
          <button
            className="mx-auto mt-6 block min-h-11 w-[240px] cursor-pointer rounded-[3px] border border-[#222] bg-[#222] px-3.5 py-[9px] leading-[1.4] text-white hover:border-[#999] hover:bg-[#444] hover:text-white focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
            type="button"
            disabled={busy}
            onClick={() => void generate()}
          >
            플래너 생성하기
          </button>
        </section>
      ) : (
        <section className="max-w-[65ch] pt-12">
          <h1 className="mb-4 text-[26px] leading-[1.35] tracking-[-1px] [font-weight:650] text-balance">
            세 가지 미래를 그리고 있어요
          </h1>
          <p>
            화면을 떠나도 생성 결과는 내 플래너 목록에서 확인할 수 있습니다.
          </p>
        </section>
      )}
      {error && (
        <div
          className="mt-6 border border-[#555] bg-[#f0f0f0] p-3.5"
          role="alert"
        >
          <p>{error}</p>
          <button
            className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
            type="button"
            disabled={busy}
            onClick={() => void retry()}
          >
            다시 시도
          </button>
        </div>
      )}
    </>
  );
}
