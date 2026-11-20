"use client";

import { Mic, Pause, Play, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { useRecorder } from "@/hooks/interview/use-recorder";

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
  const recording = state === "recording";
  return (
    <aside className="h-fit border border-ink bg-paper-raised p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-rule pb-3">
        <p className="folio">Recorder</p>
        <p className="flex items-center gap-2 text-[12px] text-ink-soft">
          <span
            className={`size-2 rounded-full ${
              recording
                ? "animate-pulse bg-c motion-reduce:animate-none"
                : state === "paused"
                  ? "bg-ink"
                  : "border border-rule-strong"
            }`}
          />
          {busy
            ? "답변 처리 중"
            : recording
              ? "녹음 중"
              : state === "paused"
                ? "일시정지"
                : "녹음 준비"}
        </p>
      </div>
      <p
        className="my-6 text-center font-mono text-[44px] tracking-[0.02em] tabular-nums"
        role="timer"
        aria-label="녹음 시간"
      >
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </p>
      <div className="flex min-h-[88px] items-center justify-center gap-4">
        <Button
          variant="icon"
          className="size-12 rounded-full"
          aria-label="다시 녹음"
          disabled={busy || state === "idle"}
          onClick={reset}
        >
          <RotateCcw className="size-5" />
        </Button>
        <Button
          variant="primary"
          className="size-[68px] rounded-full p-0"
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
            <Mic className="size-6" />
          ) : state === "recording" ? (
            <Pause className="size-6" />
          ) : (
            <Play className="size-6" />
          )}
        </Button>
        <Button
          variant="icon"
          className="size-12 rounded-full"
          aria-label="답변 제출"
          disabled={busy || state !== "paused" || seconds < 1 || oversized}
          onClick={send}
        >
          <Send className="size-5" />
        </Button>
      </div>
      <p className="mt-6 border-t border-rule pt-3 text-center text-[11px] leading-relaxed text-muted">
        문항당 최대 3분 · 20MB
        <br />
        잠시 멈춘 뒤 답변을 제출해주세요.
      </p>
      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </aside>
  );
}
