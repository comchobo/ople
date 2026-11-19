"use client";

import { Mic, Pause, Play, RotateCcw, Send } from "lucide-react";
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
  return (
    <aside className="overflow-auto border-l border-[#d4d4d4] py-7 pl-7 text-center">
      <div className="flex items-center justify-center gap-2 text-[13px]">
        <span
          className={`size-[7px] rounded-full border border-[#555] ${state === "recording" ? "bg-[#333]" : ""}`}
        />
        {busy
          ? "답변 처리 중"
          : state === "recording"
            ? "녹음 중"
            : state === "paused"
              ? "일시정지"
              : "녹음 준비"}
      </div>
      <p
        className="my-6 text-[44px] tracking-[1px] tabular-nums"
        role="timer"
        aria-label="녹음 시간"
      >
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </p>
      <div className="flex min-h-[88px] items-center justify-center gap-5">
        <button
          type="button"
          className="inline-grid size-12 shrink-0 cursor-pointer place-items-center rounded-full border border-[#d4d4d4] bg-white p-0 leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] [&_svg]:size-[22px]"
          aria-label="다시 녹음"
          disabled={busy || state === "idle"}
          onClick={reset}
        >
          <RotateCcw />
        </button>
        <button
          type="button"
          className="inline-grid size-[72px] shrink-0 cursor-pointer place-items-center rounded-full border border-[#222] bg-[#222] p-0 leading-[1.4] text-white hover:border-[#999] hover:bg-[#444] hover:text-white focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] [&_svg]:size-7"
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
          className="inline-grid size-12 shrink-0 cursor-pointer place-items-center rounded-full border border-[#d4d4d4] bg-white p-0 leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] [&_svg]:size-[22px]"
          aria-label="답변 제출"
          disabled={busy || state !== "paused" || seconds < 1 || oversized}
          onClick={send}
        >
          <Send />
        </button>
      </div>
      <p className="mt-6 text-[12px] text-[#666]">
        문항당 최대 3분 · 20MB
        <br />
        잠시 멈춘 뒤 답변을 제출해주세요.
      </p>
      {error && (
        <p
          className="mt-6 border border-[#555] bg-[#f0f0f0] p-3.5"
          role="alert"
        >
          {error}
        </p>
      )}
    </aside>
  );
}
