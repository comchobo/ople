"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import type { Interview, Planner } from "../../lib/product";
import { useRecorder } from "./use-recorder";

export function InterviewScreen({ id }: { id: string }) {
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState(300);
  const [confirmation, setConfirmation] = useState<"leave" | "rerecord" | null>(
    null,
  );
  const [generation, setGeneration] = useState<"idle" | "pending" | "failed">(
    "idle",
  );
  const dialog = useRef<HTMLDialogElement>(null);
  const recorder = useRecorder(limit);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const modal = dialog.current;
    if (confirmation && modal && !modal.open) modal.showModal();
    if (!confirmation && modal?.open) modal.close();
  }, [confirmation]);
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
    if (busy) return;
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
    if (!interview || busy) return;
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
        /* Keep the original failure and recording if reconciliation also fails. */
      }
      if (mounted.current) setError((e as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function generate() {
    if (!interview || busy) return;
    setBusy(true);
    setError("");
    setGeneration("pending");
    try {
      const result = await api<Planner>(
        `/interviews/${interview.id}/generate`,
        "POST",
      );
      router.push(`/planners/${result.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
      setGeneration("failed");
    }
  }
  async function leave() {
    if (!interview || busy) return;
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
  const active = id !== "new" && interview?.status === "active";
  const paths = {
    mic: (
      <>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" />
      </>
    ),
    pause: <path d="M8 5v14M16 5v14" />,
    play: <path d="m9 5 11 7-11 7Z" />,
    restart: <path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" />,
    submit: <path d="m21 3-7 18-4-7-7-4 18-7ZM10 14 21 3" />,
    pending: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };
  function audioButton(
    label: string,
    icon: keyof typeof paths,
    action: () => void,
    primary = false,
    disabled = false,
  ) {
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        disabled={disabled}
        onClick={action}
        className={`inline-grid shrink-0 place-items-center rounded-full! p-0! ${primary ? "h-[72px] w-[72px] border-[#222]! bg-[#222]! text-white! hover:bg-[#444]!" : "h-12 w-12"}`}
      >
        <svg
          viewBox="0 0 24 24"
          width={primary ? 28 : 22}
          height={primary ? 28 : 22}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          {paths[icon]}
        </svg>
      </button>
    );
  }
  const notice = error && (
    <div
      role="alert"
      className="mt-6 border border-[#555] bg-[#f0f0f0] p-3.5 text-[13px]"
    >
      {error}
      {active && (
        <button
          type="button"
          disabled={busy || recorder.state !== "paused"}
          className="mt-6 w-full"
          onClick={submit}
        >
          답변 처리 재시도
        </button>
      )}
      {!interview && id !== "new" && (
        <button type="button" onClick={load}>
          다시 불러오기
        </button>
      )}{" "}
      {!interview && (
        <Link
          href="/tmp/preview/implementation"
          className="underline underline-offset-4"
        >
          로그인·계정
        </Link>
      )}
    </div>
  );
  return (
    <main
      className={`mx-auto h-[calc(min(100dvh,834px)-70px)] w-full max-w-[1194px] min-h-0 bg-white p-7 text-[15px] leading-[1.6] text-[#222] [font-family:-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] [word-break:keep-all] selection:bg-[#222] selection:text-white [&_.text-xs]:leading-[1.6] [&_.text-sm]:leading-[1.6] [&_.text-base]:leading-[1.6] [&_h1]:text-balance [&_button]:min-h-11 [&_button]:rounded-[3px] [&_button]:border [&_button]:border-[#d4d4d4] [&_button]:bg-white [&_button]:px-3.5 [&_button]:py-[9px] [&_button]:leading-[1.4] [&_button]:cursor-pointer [&_button:hover]:border-[#999] [&_button:hover]:bg-[#f3f3f3] [&_button:disabled]:cursor-default [&_button:disabled]:opacity-45 [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-3 [&_:focus-visible]:outline-[#222] ${active ? "grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] grid-rows-[auto_auto_minmax(0,1fr)] gap-x-8 overflow-hidden" : "overflow-auto [scrollbar-color:#aaa_#f3f3f3] [scrollbar-width:thin]"}`}
    >
      <nav aria-label="진행 단계" className="col-span-full mb-7">
        <ol className="grid grid-cols-3 gap-1.5">
          {["인터뷰", "플래너 생성", "검토·수정"].map((label, i) => {
            const current =
              interview?.status === "generated"
                ? 3
                : interview?.status === "complete"
                  ? 2
                  : 1;
            return (
              <li
                key={label}
                aria-current={current === i + 1 ? "step" : undefined}
                className={`flex items-center justify-center gap-2 border px-1 py-3 text-[13px] whitespace-nowrap ${current === i + 1 ? "border-[#222] bg-[#222] font-[650] text-white" : "border-[#d4d4d4] bg-[#f3f3f3]"}`}
              >
                <span className="text-base font-[650]">{i + 1}</span>
                <span>{label}</span>
              </li>
            );
          })}
        </ol>
      </nav>
      {id === "new" && (
        <section className="mx-auto w-full max-w-[640px]">
          <h1 className="mb-6 text-center text-[30px] leading-[1.35] font-[650] tracking-[-1px]">
            질문을 보고
            <br />
            편하게 답해주세요
          </h1>
          <p className="text-center text-[#666]">
            현재 생활과 바람, 계획에 필요한 여건을 이야기합니다. 정리된 답변일
            필요는 없습니다.
          </p>
          <p className="mt-6 text-center text-xs text-[#666]">
            새 플래너를 만듭니다. 저장된 플래너는 그대로 유지됩니다.
          </p>
          <ol className="my-6 list-decimal border border-[#d4d4d4] bg-[#f3f3f3] py-3.5 pr-3.5 pl-[34px] text-[13px]">
            <li>
              질문은 화면에서 확인합니다. 이전 답변을 반영한 총 10문항입니다.
            </li>
            <li>마이크 아이콘을 누르면 녹음이 시작됩니다.</li>
            <li>
              일시정지 아이콘으로 멈추고, 재생 아이콘으로 이어 녹음합니다.
            </li>
            <li>종이비행기 아이콘을 눌러 답변을 제출합니다.</li>
          </ol>
          <p className="text-xs text-[#666]">
            질문당 최대 {Math.floor(limit / 60)}분이며 자동 제출하지 않습니다.
            제출한 원본은 서버에 계속 보관됩니다. 인터뷰 종료 후 미완료 답변을
            재개할 수 없습니다.
          </p>
          {notice}
          <button
            type="button"
            disabled={busy}
            onClick={start}
            className="mx-auto mt-6 block w-60 border-[#222]! bg-[#222]! text-white! hover:bg-[#444]!"
          >
            {busy ? "첫 질문을 준비하고 있습니다" : "인터뷰 시작"}
          </button>
        </section>
      )}
      {id !== "new" && !interview && (
        <div role="status">인터뷰를 불러오는 중입니다.{notice}</div>
      )}
      {interview?.status === "generated" && (
        <section>
          <h1 className="text-[30px] leading-[1.35] font-[650] tracking-[-1px]">
            이미 계획을 생성한 인터뷰입니다.
          </h1>
          <Link className="underline underline-offset-4" href="/planners">
            내 플래너에서 확인하기
          </Link>
        </section>
      )}
      {interview?.status === "complete" &&
        (generation === "idle" ? (
          <section>
            <h1 className="mx-auto max-w-[640px] text-center text-[30px] leading-[1.35] font-[650] tracking-[-1px]">
              답변을 바탕으로
              <br />세 가지 계획을 만듭니다
            </h1>
            <p className="mx-auto mt-6 max-w-[640px] text-center text-[#666]">
              현재 방향, 다른 가능성, 원하는 삶을 각각 5년의 활동과 경험으로
              정리합니다.
            </p>
            <div className="mx-auto mt-6 max-w-[640px] border border-[#d4d4d4] bg-[#f3f3f3] p-3.5 text-[13px]">
              <strong>답변에서 정리한 내용</strong>
              <ul className="mt-[1em] list-disc pl-[18px]">
                {interview.summary
                  .split("\n")
                  .filter(Boolean)
                  .map((line) => (
                    <li key={line}>{line}</li>
                  ))}
              </ul>
            </div>
            <button
              type="button"
              className="mx-auto mt-6 block w-60 border-[#222]! bg-[#222]! text-white! hover:bg-[#444]!"
              disabled={busy}
              onClick={generate}
            >
              플래너 생성
            </button>
          </section>
        ) : (
          <section className="max-w-[65ch] pt-12" aria-live="polite">
            <h1 className="mb-4 text-[26px] leading-[1.35] font-[650] tracking-[-1px]">
              {generation === "failed"
                ? "계획을 만들지 못했습니다"
                : "세 가지 방향을 정리하고 있습니다"}
            </h1>
            <p className="text-[#666]">
              {generation === "failed"
                ? "인터뷰 답변은 유지됩니다. 다시 시도해주세요."
                : "답변의 관심사와 여건을 바탕으로 서로 다른 계획을 구성합니다."}
            </p>
            {generation === "failed" && (
              <>
                {notice}
                <button
                  type="button"
                  className="mt-6 w-full border-[#222]! bg-[#222]! text-white!"
                  disabled={busy}
                  onClick={generate}
                >
                  다시 시도
                </button>
              </>
            )}
          </section>
        ))}
      {active && interview && (
        <>
          <div className="col-span-full mb-7">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#666]">
                질문 {interview.position + 1} / 10
              </span>
              <button
                type="button"
                disabled={busy}
                className="border-transparent! bg-transparent! p-2! text-xs underline underline-offset-4"
                onClick={() => setConfirmation("leave")}
              >
                나가기
              </button>
            </div>
            <div
              role="progressbar"
              aria-label="현재 질문 진행"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={interview.position + 1}
              className="mt-4 flex gap-[5px]"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((question) => (
                <span
                  key={question}
                  className={`h-[3px] flex-1 ${question <= interview.position + 1 ? "bg-[#333]" : "bg-[#e5e5e5]"}`}
                />
              ))}
            </div>
          </div>
          <section className="min-w-0 overflow-auto py-6 pr-4">
            <h1 className="max-w-[23ch] text-[32px] leading-[1.35] font-[650] tracking-[-1px]">
              {interview.question || "다음 질문을 준비하고 있습니다."}
            </h1>
          </section>
          <section
            aria-label="답변 녹음"
            className="overflow-auto border-l border-[#d4d4d4] py-7 pl-7 text-center"
          >
            <div
              role="status"
              className="flex items-center justify-center gap-2 text-[13px]"
            >
              <span
                aria-hidden="true"
                className={`h-[7px] w-[7px] rounded-full border border-[#555] ${!busy && recorder.state === "recording" ? "bg-[#333]" : ""}`}
              />
              {busy
                ? "답변 처리 중"
                : recorder.state === "recording"
                  ? "녹음 중"
                  : recorder.state === "paused"
                    ? "일시정지"
                    : recorder.state === "requesting"
                      ? "마이크 권한 확인 중"
                      : "답변 대기"}
            </div>
            <div
              role="timer"
              aria-label={`녹음 ${recorder.seconds}초`}
              className="my-6 text-[44px] tracking-[1px] tabular-nums"
            >
              {String(Math.floor(recorder.seconds / 60)).padStart(2, "0")}:
              {String(recorder.seconds % 60).padStart(2, "0")}
            </div>
            <div className="flex min-h-[88px] items-center justify-center gap-5">
              {busy ? (
                audioButton("답변 처리 중", "pending", () => {}, false, true)
              ) : recorder.state === "paused" ? (
                <>
                  {audioButton("다시 녹음", "restart", () =>
                    setConfirmation("rerecord"),
                  )}
                  {audioButton(
                    "이어 녹음",
                    "play",
                    recorder.start,
                    true,
                    recorder.interrupted || recorder.seconds >= limit,
                  )}
                  {audioButton("답변 제출", "submit", submit)}
                </>
              ) : recorder.state === "recording" ? (
                audioButton("일시정지", "pause", recorder.pause, true)
              ) : (
                audioButton(
                  "답변 시작",
                  "mic",
                  recorder.start,
                  true,
                  recorder.state === "requesting",
                )
              )}
            </div>
            {recorder.error && (
              <p
                role="alert"
                className="mt-6 border border-[#555] bg-[#f0f0f0] p-3.5 text-[13px]"
              >
                {recorder.error}
              </p>
            )}
            {recorder.seconds >= Math.max(0, limit - 30) && (
              <p role="status" className="mt-6 text-[13px] text-[#666]">
                {recorder.seconds >= limit
                  ? "최대 녹음 시간입니다. 답변을 제출하거나 다시 녹음하세요."
                  : "최대 녹음 시간까지 30초 이하 남았습니다."}
              </p>
            )}
            {!confirmation && notice}
          </section>
        </>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="interview-dialog-title"
        onCancel={(e) => {
          e.preventDefault();
          if (!busy) setConfirmation(null);
        }}
        className="m-auto max-h-[min(786px,calc(100dvh-48px))] w-[560px] max-w-[calc(100%-48px)] overflow-auto overscroll-contain rounded-[7px] border border-[#999] bg-white p-0 text-[#222] backdrop:bg-black/30"
      >
        {confirmation && (
          <div className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2
                id="interview-dialog-title"
                className="text-xl leading-[1.45] font-[650] tracking-[-.5px]"
              >
                {confirmation === "leave"
                  ? "인터뷰를 나갈까요?"
                  : "다시 녹음할까요?"}
              </h2>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmation(null)}
              >
                닫기
              </button>
            </div>
            <p className="mb-5 text-sm text-[#555]">
              {confirmation === "leave"
                ? "진행 중인 인터뷰는 종료되며 다시 시작해야 합니다. 기존 플래너는 유지되고 이미 전송한 음성 원본은 서버에 계속 보관됩니다."
                : "이 질문의 기존 녹음을 지우고 다시 시작합니다."}
            </p>
            {confirmation === "leave" && error && (
              <p
                role="alert"
                className="border border-[#555] bg-[#f0f0f0] p-3.5"
              >
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-between gap-2 border-t border-[#d4d4d4] pt-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmation(null)}
              >
                {confirmation === "leave" ? "계속하기" : "취소"}
              </button>
              <button
                type="button"
                className="ml-auto border-[#222]! bg-[#222]! text-white! hover:bg-[#444]!"
                disabled={busy}
                onClick={
                  confirmation === "leave"
                    ? leave
                    : () => {
                        recorder.reset();
                        setError("");
                        setConfirmation(null);
                      }
                }
              >
                {confirmation === "leave" ? "나가기" : "다시 시작"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </main>
  );
}
