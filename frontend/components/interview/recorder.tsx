"use client";

import { Mic, Pause, Play, RotateCcw, Send } from "lucide-react";
import { useRecorder } from "@/hooks/use-recorder";

export function Recorder({
  submit,
  busy,
}: {
  submit: (blob: Blob, duration: number) => Promise<void>;
  busy: boolean;
}) {
  const {
    state,
    seconds,
    error,
    starting,
    oversized,
    start,
    pause,
    resume,
    reset,
    send,
  } = useRecorder(submit);
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
            else if (state === "recording") pause();
            else resume();
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
          disabled={busy || state !== "paused" || seconds < 1 || oversized}
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
