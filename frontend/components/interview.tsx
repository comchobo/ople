"use client";

import { Mic, Pause, Play, RotateCcw, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Answer, Job } from "@/api/core";
import { createGeneration, runGeneration } from "@/api/generations";
import { getQuestion, getSummary, uploadRecording } from "@/api/interview";
import { setInterviewActive } from "./navigation";

function stopMedia(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

export function Steps({ current }: { current: number }) {
  return (
    <nav className="steps" aria-label="플래너 만들기 단계">
      <ol>
        {["인터뷰", "답변 정리", "플래너 생성"].map((label, i) => (
          <li key={label} aria-current={i === current ? "step" : undefined}>
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Recorder({
  submit,
  busy,
}: {
  submit: (blob: Blob, duration: number) => Promise<void>;
  busy: boolean;
}) {
  const [state, setState] = useState<"idle" | "recording" | "paused">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const size = useRef(0);
  const secondsRef = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (recorder.current?.state !== "inactive") recorder.current?.stop();
      stopMedia(stream.current);
    };
  }, []);
  useEffect(() => {
    if (state !== "recording") return;
    const timer = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
      if (secondsRef.current >= 180) {
        recorder.current?.pause();
        setState("paused");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);
  async function start() {
    setError("");
    setStarting(true);
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error(
          "이 환경에서는 녹음을 사용할 수 없습니다. HTTPS 연결과 브라우저의 마이크 지원을 확인해주세요.",
        );
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        stopMedia(media);
        return;
      }
      stream.current = media;
      const mime = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((value) => MediaRecorder.isTypeSupported(value));
      if (!mime) throw new Error("지원되는 녹음 형식이 없습니다.");
      const value = new MediaRecorder(media, { mimeType: mime });
      chunks.current = [];
      size.current = 0;
      secondsRef.current = 0;
      setSeconds(0);
      value.ondataavailable = (event) => {
        if (event.data.size) {
          chunks.current.push(event.data);
          size.current += event.data.size;
        }
        if (size.current > 20 * 1024 * 1024 && value.state === "recording") {
          value.pause();
          setState("paused");
          setError("20MB를 초과했습니다. 다시 녹음해주세요.");
        }
      };
      value.onerror = () => {
        setError("녹음 중 오류가 발생했습니다. 다시 녹음해주세요.");
        stopMedia(stream.current);
        setState("idle");
      };
      recorder.current = value;
      value.start(1000);
      setState("recording");
    } catch (cause) {
      stopMedia(stream.current);
      setError((cause as Error).message);
    } finally {
      if (mounted.current) setStarting(false);
    }
  }
  function reset() {
    if (!window.confirm("녹음한 내용을 지우고 다시 녹음할까요?")) return;
    if (recorder.current?.state !== "inactive") recorder.current?.stop();
    stopMedia(stream.current);
    recorder.current = null;
    chunks.current = [];
    secondsRef.current = 0;
    setSeconds(0);
    setState("idle");
    setError("");
  }
  function send() {
    const value = recorder.current;
    if (!value || value.state === "inactive") return;
    value.onstop = () => {
      stopMedia(stream.current);
      const blob = new Blob(chunks.current, { type: value.mimeType });
      if (blob.size > 20 * 1024 * 1024) {
        setError("20MB를 초과했습니다. 다시 녹음해주세요.");
        setState("idle");
        return;
      }
      void submit(blob, Math.max(1, Math.min(secondsRef.current, 180))).catch(
        (cause) => {
          if (mounted.current) {
            setError((cause as Error).message);
            setState("idle");
          }
        },
      );
    };
    value.stop();
  }
  return (
    <aside className="record-panel">
      <div className="record-state">
        <span
          className={`status-dot ${state === "recording" ? "active" : ""}`}
        />
        {busy
          ? "답변 처리 중"
          : state === "recording"
            ? "녹음 중"
            : state === "paused"
              ? "일시정지"
              : "녹음 준비"}
      </div>
      <p className="timer" role="timer" aria-label="녹음 시간">
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </p>
      <div className="record-actions">
        <button
          type="button"
          className="audio-button"
          aria-label="다시 녹음"
          disabled={busy || state === "idle"}
          onClick={reset}
        >
          <RotateCcw />
        </button>
        <button
          type="button"
          className="audio-button main-control primary"
          aria-label={
            state === "idle"
              ? "녹음 시작"
              : state === "recording"
                ? "일시정지"
                : "녹음 계속"
          }
          disabled={busy || starting || (state === "paused" && seconds >= 180)}
          onClick={() => {
            if (state === "idle") void start();
            else if (state === "recording") {
              recorder.current?.pause();
              setState("paused");
            } else {
              recorder.current?.resume();
              setState("recording");
            }
          }}
        >
          {state === "idle" ? (
            <Mic />
          ) : state === "recording" ? (
            <Pause />
          ) : (
            <Play />
          )}
        </button>
        <button
          type="button"
          className="audio-button"
          aria-label="답변 제출"
          disabled={
            busy ||
            state !== "paused" ||
            seconds < 1 ||
            size.current > 20 * 1024 * 1024
          }
          onClick={send}
        >
          <Send />
        </button>
      </div>
      <p className="small muted space">
        문항당 최대 3분 · 20MB
        <br />
        잠시 멈춘 뒤 답변을 제출해주세요.
      </p>
      {error && (
        <p className="error space" role="alert">
          {error}
        </p>
      )}
    </aside>
  );
}

export function Interview({
  exit,
  generated,
}: {
  exit: () => void;
  generated: (job: Job) => void;
}) {
  const [interviewId] = useState(() => crypto.randomUUID());
  const [jobId] = useState(() => crypto.randomUUID());
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [question, setQuestion] = useState("");
  const [summary, setSummary] = useState("");
  const [phase, setPhase] = useState<
    "prepare" | "interview" | "summary" | "generating"
  >("prepare");
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    setInterviewActive(!submitted);
    return () => setInterviewActive(false);
  }, [submitted]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function advance(values: Answer[]) {
    setBusy(true);
    setError("");
    try {
      if (values.length === 10) {
        const result = await getSummary(interviewId, values);
        if (mounted.current) {
          setSummary(result.summary);
          setPhase("summary");
        }
      } else {
        const result = await getQuestion(interviewId, values);
        if (mounted.current) {
          setQuestion(result.question);
          setPhase("interview");
        }
      }
    } catch (cause) {
      if (mounted.current) setError((cause as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function submit(blob: Blob, duration: number) {
    setBusy(true);
    setError("");
    try {
      const result = await uploadRecording(
        interviewId,
        answers.length,
        blob,
        duration,
      );
      if (!mounted.current) return;
      const values = [
        ...answers,
        { question, answer: result.text, recording_id: result.recording_id },
      ];
      setAnswers(values);
      setQuestion("");
      await advance(values);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function generate() {
    setBusy(true);
    setError("");
    setPhase("generating");
    try {
      await createGeneration(jobId, interviewId, answers, summary);
      if (mounted.current) setSubmitted(true);
      const job = await runGeneration(jobId);
      if (mounted.current) generated(job);
    } catch (cause) {
      if (mounted.current) setError((cause as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <>
      <Steps
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
            onClick={() => void advance([])}
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
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void (phase === "generating" ? generate() : advance(answers))
            }
          >
            다시 시도
          </button>
        </div>
      )}
    </>
  );
}
