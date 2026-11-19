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
        <section className="prepare-content">
          <h1>나의 가능성을 이야기해보세요</h1>
          <p>
            10개의 질문에 음성으로 답하면 서로 다른 세 가지 5년 계획을 만듭니다.
          </p>
          <ol>
            <li>마이크 버튼으로 녹음을 시작하세요.</li>
            <li>일시정지 후 이어서 녹음하거나 답변을 제출하세요.</li>
            <li>
              기존 플래너는 그대로 유지됩니다. 중단한 인터뷰는 이어할 수
              없습니다.
            </li>
          </ol>
          <p className="notice">
            녹음 원본은 서버에 영구 보관됩니다. 답변은 Cloudflare 음성 인식과
            Ollama AI 생성에 사용됩니다.
          </p>
          <button
            className="primary space"
            disabled={busy}
            onClick={() => void start()}
            type="button"
          >
            {busy ? "질문 생성 중…" : "인터뷰 시작"}
          </button>
        </section>
      ) : phase === "interview" ? (
        <>
          <div className="interview-head row between">
            <div>
              <h2>나의 미래를 탐색하는 인터뷰</h2>
              <p className="muted">
                질문 {Math.min(answers.length + 1, 10)} / 10
              </p>
            </div>
            <button type="button" onClick={exit}>
              나가기
            </button>
          </div>
          <div className="progress">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
              <span
                key={step}
                className={step <= answers.length ? "done" : ""}
              />
            ))}
          </div>
          {question ? (
            <div className="interview-layout">
              <section className="question">
                <h1>{question}</h1>
              </section>
              <Recorder key={answers.length} submit={submit} busy={busy} />
            </div>
          ) : (
            <p className="space">
              {busy
                ? "답변을 정리하고 다음 단계를 준비하고 있습니다…"
                : "다음 단계를 다시 요청해주세요."}
            </p>
          )}
        </>
      ) : phase === "summary" ? (
        <section className="complete">
          <h1>이야기를 정리했어요</h1>
          <p className="notice space preserve">{summary}</p>
          <button
            className="primary space"
            type="button"
            disabled={busy}
            onClick={() => void generate()}
          >
            플래너 생성하기
          </button>
        </section>
      ) : (
        <section className="busy">
          <h1>세 가지 미래를 그리고 있어요</h1>
          <p>
            화면을 떠나도 생성 결과는 내 플래너 목록에서 확인할 수 있습니다.
          </p>
        </section>
      )}
      {error && (
        <div className="error space" role="alert">
          <p>{error}</p>
          <button type="button" disabled={busy} onClick={() => void retry()}>
            다시 시도
          </button>
        </div>
      )}
    </>
  );
}
