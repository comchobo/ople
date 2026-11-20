"use client";

import { ArrowRight } from "lucide-react";
import type { Job } from "@/api/core";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
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
  const current = Math.min(answers.length + 1, 10);
  return (
    <>
      <InterviewSteps
        current={phase === "summary" ? 1 : phase === "generating" ? 2 : 0}
      />

      {phase === "prepare" ? (
        <section className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7">
            <h1 className="text-title font-extrabold text-balance">
              나의 가능성을 이야기해보세요
            </h1>
            <p className="mt-5 max-w-[32em] font-serif text-deck text-ink-soft">
              10개의 질문에 음성으로 답하면 서로 다른 세 가지 5년 계획을
              만듭니다.
            </p>
            <Button
              variant="primary"
              className="mt-8 px-6"
              disabled={busy}
              onClick={() => void start()}
            >
              {busy ? "질문 생성 중…" : "인터뷰 시작"}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
          <aside className="border border-ink bg-paper-raised p-5 md:col-span-5 md:p-6">
            <p className="folio mb-3">Before you start</p>
            <ol className="list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-ink-soft">
              <li>마이크 버튼으로 녹음을 시작하세요.</li>
              <li>일시정지 후 이어서 녹음하거나 답변을 제출하세요.</li>
              <li>
                기존 플래너는 그대로 유지됩니다. 중단한 인터뷰는 이어할 수
                없습니다.
              </li>
            </ol>
            <p className="mt-5 border-t border-rule pt-4 text-[13px] leading-relaxed text-ink-soft">
              녹음 원본은 서버에 영구 보관됩니다. 답변은 Cloudflare 음성 인식과
              Ollama AI 생성에 사용됩니다.
            </p>
          </aside>
          <div className="grid gap-4 border-t border-rule pt-5 md:col-span-12 md:grid-cols-3">
            {[
              ["A", "현재 방향을 발전시키는 계획", "text-a"],
              ["B", "다른 방향을 탐색하는 계획", "text-b"],
              ["C", "원하는 삶에서 출발하는 계획", "text-c"],
            ].map(([letter, title, color]) => (
              <div key={letter}>
                <p className={`folio mb-1 ${color}`}>{letter}</p>
                <p className="text-[13px] leading-snug font-semibold">
                  {title}
                </p>
              </div>
            ))}
            <p className="text-[12px] leading-relaxed text-muted md:col-span-3">
              인터뷰는 약 10분. 답변은 저장되지만, 중단한 인터뷰는 이어할 수
              없습니다.
            </p>
          </div>
        </section>
      ) : phase === "interview" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
            <div>
              <h2 className="text-[20px] font-bold tracking-[-0.03em]">
                나의 미래를 탐색하는 인터뷰
              </h2>
              <p className="mt-1 text-[12px] text-muted">질문 {current} / 10</p>
            </div>
            <Button variant="secondary" onClick={exit}>
              나가기
            </Button>
          </div>
          <div className="mt-4 flex gap-[4px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
              <span
                key={step}
                className={`h-[3px] flex-1 ${
                  step <= answers.length ? "bg-ink" : "bg-paper-deep"
                }`}
              />
            ))}
          </div>
          {question ? (
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-12">
              <section className="min-w-0 lg:pr-10">
                <h1 className="max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.18] font-extrabold tracking-[-0.04em] text-balance">
                  {question}
                </h1>
                <p className="mt-6 max-w-[34em] text-[13px] leading-relaxed text-muted">
                  답변은 음성으로 기록됩니다. 생각이 정리될 때까지 잠시 멈춰도
                  좋습니다.
                </p>
              </section>
              <Recorder key={answers.length} submit={submit} busy={busy} />
            </div>
          ) : (
            <p className="mt-8 text-[15px] text-muted">
              {busy
                ? "답변을 정리하고 다음 단계를 준비하고 있습니다…"
                : "다음 단계를 다시 요청해주세요."}
            </p>
          )}
        </>
      ) : phase === "summary" ? (
        <section className="mx-auto max-w-[760px]">
          <h1 className="text-title font-extrabold text-balance">
            이야기를 정리했어요
          </h1>
          <div className="mt-6 border border-ink bg-paper-raised p-6">
            <p className="whitespace-pre-wrap font-serif text-[17px] leading-[1.9] text-ink-soft">
              {summary}
            </p>
          </div>
          <Button
            variant="primary"
            className="mt-6 px-6"
            disabled={busy}
            onClick={() => void generate()}
          >
            플래너 생성하기
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </section>
      ) : (
        <section className="mx-auto max-w-[760px]">
          <h1 className="text-title font-extrabold text-balance">
            세 가지 미래를 그리고 있어요
          </h1>
          <div className="mt-8 grid grid-cols-3 gap-2" aria-hidden="true">
            <span className="h-2 animate-pulse bg-a motion-reduce:animate-none" />
            <span className="h-2 animate-pulse bg-b motion-reduce:animate-none [animation-delay:120ms]" />
            <span className="h-2 animate-pulse bg-c motion-reduce:animate-none [animation-delay:240ms]" />
          </div>
          <p className="mt-6 max-w-[40em] text-[15px] leading-relaxed text-muted">
            화면을 떠나도 생성 결과는 내 플래너 목록에서 확인할 수 있습니다.
          </p>
        </section>
      )}

      {error && (
        <div className="mt-8">
          <Notice tone="error">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>{error}</p>
              <Button
                variant="secondary"
                className="text-[12px]"
                disabled={busy}
                onClick={() => void retry()}
              >
                다시 시도
              </Button>
            </div>
          </Notice>
        </div>
      )}
    </>
  );
}
