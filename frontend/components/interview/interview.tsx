"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import type { Interview, Planner } from "../../lib/product";
import s from "../planner/feature.module.css";
import { useRecorder } from "./use-recorder";

export function InterviewScreen({ id }: { id: string }) {
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState(300);
  const recorder = useRecorder(limit);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const load = useCallback(async () => {
    try {
      const config = await api<{ recording_max_seconds: number }>("/config");
      setLimit(config.recording_max_seconds);
      if (id !== "new") setInterview(await api<Interview>(`/interviews/${id}`));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (interview?.status === "active" || busy) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [interview, busy]);
  async function start() {
    setBusy(true);
    setError("");
    try {
      const result = await api<Interview>("/interviews", "POST");
      setInterview(result);
      router.replace(`/interviews/${result.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (!interview) return;
    const blob = recorder.recording();
    if (!blob?.size) {
      setError("녹음한 답변이 필요합니다.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const next = await api<Interview>(
        `/interviews/${interview.id}/answers/${interview.position}/${crypto.randomUUID()}`,
        "POST",
        blob,
      );
      if (mounted.current) {
        recorder.reset();
        setInterview(next);
      }
    } catch (e) {
      // The server may have committed successfully before the connection failed.
      // Read persisted progress before offering another upload to an old question.
      try {
        const persisted = await api<Interview>(`/interviews/${interview.id}`);
        if (
          mounted.current &&
          (persisted.position > interview.position ||
            persisted.status !== "active")
        ) {
          recorder.reset();
          setInterview(persisted);
          return;
        }
      } catch {
        /* Preserve the original failure and recording when reconciliation also fails. */
      }
      if (mounted.current) setError((e as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function generate() {
    if (!interview) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<Planner>(
        `/interviews/${interview.id}/generate`,
        "POST",
      );
      router.push(`/planners/${result.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  async function leave() {
    if (
      !interview ||
      !confirm(
        "인터뷰를 종료할까요? 다시 시작해야 합니다. 이미 전송한 음성 원본은 서버에 계속 보관됩니다.",
      )
    )
      return;
    setBusy(true);
    try {
      await api(`/interviews/${interview.id}`, "DELETE");
      recorder.release();
      router.push("/planners");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <main className={s.surface}>
      <div className={s.content}>
        <div className={s.heading}>
          <h1>
            {interview?.status === "complete"
              ? "답변 요약 확인"
              : "새로운 가능성을 위한 인터뷰"}
          </h1>
          {interview ? (
            <button type="button" disabled={busy} onClick={leave}>
              인터뷰 나가기
            </button>
          ) : (
            <Link href="/planners">내 플래너</Link>
          )}
        </div>
        {error && (
          <div role="alert" className={s.error}>
            {error}{" "}
            {id !== "new" && !interview && (
              <button type="button" onClick={load}>
                다시 불러오기
              </button>
            )}{" "}
            <Link href="/tmp/preview/implementation">로그인·계정</Link>
          </div>
        )}
        {busy && (
          <p role="status" className={s.notice}>
            처리 중입니다. 일시적인 오류는 서버가 자동으로 재시도합니다. 응답이
            올 때까지 기다려주세요.
          </p>
        )}
        {id === "new" && (
          <section className={s.editor}>
            <h2>내 목소리로 답하는 10개의 질문</h2>
            <p>
              이전 답변에 맞춰 다음 질문이 만들어집니다. 정답 없이 현재의 일과
              생활, 바라는 삶을 이야기해주세요.
            </p>
            <ol>
              <li>마이크 권한을 허용하고 녹음을 시작하세요.</li>
              <li>
                일시정지 후 이어 녹음할 수 있으며 질문당 최대{" "}
                {Math.floor(limit / 60)}분입니다.
              </li>
              <li>전송 버튼을 누를 때만 음성이 서버로 전송됩니다.</li>
              <li>
                전송한 원본은 서버에 계속 보관됩니다. 재생·다운로드 기능은
                제공하지 않습니다.
              </li>
              <li>
                10문항을 마치면 요약을 확인하고 A/B/C 계획을 생성합니다. 종료 후
                미완료 인터뷰를 재개할 수 없습니다.
              </li>
            </ol>
            <button
              type="button"
              className={s.primary}
              disabled={busy}
              onClick={start}
            >
              첫 질문 만들기
            </button>
          </section>
        )}
        {id !== "new" && !interview && !error && (
          <p role="status">인터뷰를 불러오는 중입니다.</p>
        )}
        {interview?.status === "generated" && (
          <section>
            <h2>이미 계획을 생성한 인터뷰입니다.</h2>
            <Link href="/planners">내 플래너에서 확인하기</Link>
          </section>
        )}
        {interview?.status === "complete" && (
          <section>
            <h2>이야기에서 발견한 방향</h2>
            <p>{interview.summary}</p>
            <p className={s.muted}>
              요약은 답변을 바탕으로 생성했습니다. 계획은 언제든 보드에서 직접
              편집할 수 있습니다.
            </p>
            <button
              type="button"
              className={s.primary}
              disabled={busy}
              onClick={generate}
            >
              세 가지 계획 생성
            </button>
          </section>
        )}
        {interview?.status === "active" && (
          <>
            <p>{interview.position + 1} / 10번째 질문</p>
            <progress
              value={interview.answered}
              max={10}
              aria-label="인터뷰 진행"
            />
            <div className={s.interview}>
              <section>
                <h2>
                  {interview.question || "다음 질문을 준비하고 있습니다."}
                </h2>
                <p className={s.muted}>
                  생각나는 만큼 편하게 말해주세요. 전송한 답변은 되돌릴 수
                  없습니다.
                </p>
              </section>
              <section className={s.record} aria-label="음성 답변 녹음">
                <p role="status">
                  {recorder.state === "recording"
                    ? "녹음 중"
                    : recorder.state === "paused"
                      ? "일시정지"
                      : recorder.state === "requesting"
                        ? "마이크 권한 확인 중"
                        : "녹음 준비"}
                </p>
                <div
                  role="timer"
                  className={s.timer}
                  aria-label={`녹음 ${recorder.seconds}초`}
                >
                  {String(Math.floor(recorder.seconds / 60)).padStart(2, "0")}:
                  {String(recorder.seconds % 60).padStart(2, "0")}
                </div>
                {recorder.error && (
                  <p role="alert" className={s.error}>
                    {recorder.error}
                  </p>
                )}
                {recorder.seconds >= Math.max(0, limit - 30) && (
                  <p role="status">
                    {recorder.seconds >= limit
                      ? "최대 녹음 시간입니다. 답변을 전송하거나 다시 녹음하세요."
                      : "최대 녹음 시간까지 30초 이하 남았습니다."}
                  </p>
                )}
                <div className={s.actions}>
                  {recorder.state === "recording" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={recorder.pause}
                    >
                      일시정지
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        busy ||
                        recorder.interrupted ||
                        recorder.state === "requesting" ||
                        recorder.seconds >= limit
                      }
                      onClick={recorder.start}
                    >
                      {recorder.state === "paused" ? "이어 녹음" : "녹음 시작"}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={
                      busy ||
                      recorder.state === "idle" ||
                      recorder.state === "requesting"
                    }
                    onClick={() => {
                      if (confirm("현재 녹음을 버리고 다시 녹음할까요?"))
                        recorder.reset();
                    }}
                  >
                    다시 녹음
                  </button>
                  <button
                    type="button"
                    className={s.primary}
                    disabled={busy || recorder.state !== "paused"}
                    onClick={submit}
                  >
                    답변 전송
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
