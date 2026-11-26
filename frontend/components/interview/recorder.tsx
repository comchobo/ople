"use client";

import { Mic, Pause, Play, RotateCcw, Send } from "lucide-react";
import { type RefObject, useRef, useState } from "react";
import { Modal } from "@/components/modal";
import {
  RECORDING_LIMIT_SECONDS,
  useRecorder,
} from "@/hooks/interview/use-recorder";

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
  const remaining = RECORDING_LIMIT_SECONDS - seconds;
  const atLimit = remaining === 0;
  const warning = remaining > 0 && remaining <= 30;
  const canSubmit = !busy && state === "paused" && seconds >= 1 && !oversized;
  const resetButton = useRef<HTMLButtonElement>(null);
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
        className={`mt-6 text-[44px] tracking-[1px] tabular-nums ${warning ? "text-red-800" : ""} ${warning && state === "recording" ? "motion-safe:animate-pulse" : ""}`}
        role="timer"
        aria-label="녹음 시간"
      >
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </p>
      {warning && <p className="text-sm text-red-800">{remaining}초 남음</p>}
      {atLimit && <p className="text-sm">3분 제한으로 녹음이 멈췄어요.</p>}
      <div className="mt-6 flex min-h-[88px] items-center justify-center gap-5">
        <button
          type="button"
          className="inline-grid size-12 shrink-0 cursor-pointer place-items-center rounded-full border border-[#d4d4d4] bg-white p-0 leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] [&_svg]:size-[22px]"
          ref={resetButton}
          aria-label="다시 녹음"
          disabled={busy || (state === "idle" && !atLimit)}
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
          disabled={busy || starting || atLimit || oversized}
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
          disabled={!canSubmit}
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
      {atLimit && (
        <LimitDialog
          canSubmit={canSubmit}
          busy={busy}
          error={error}
          reset={reset}
          send={send}
          returnFocusRef={resetButton}
        />
      )}
    </aside>
  );
}

function LimitDialog({
  canSubmit,
  busy,
  error,
  reset,
  send,
  returnFocusRef,
}: {
  canSubmit: boolean;
  busy: boolean;
  error: string;
  reset: () => void;
  send: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <Modal
      title="3분 제한으로 녹음이 멈췄어요."
      close={() => setOpen(false)}
      returnFocusRef={returnFocusRef}
    >
      {error && (
        <p className="mb-4 text-sm" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="rounded border border-[#999] px-4 py-2"
          onClick={reset}
          disabled={busy}
        >
          다시 녹음
        </button>
        {canSubmit && (
          <button
            type="button"
            className="rounded bg-[#222] px-4 py-2 text-white"
            onClick={() => {
              setOpen(false);
              send();
            }}
          >
            답변 제출
          </button>
        )}
      </div>
    </Modal>
  );
}
