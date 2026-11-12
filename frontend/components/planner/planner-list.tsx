"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { createdLabel, type Planner } from "../../lib/product";

export function PlannerList() {
  const [rows, setRows] = useState<Planner[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<Planner | null>(null);
  const [mode, setMode] = useState<"rename" | "delete" | null>(null);
  const [name, setName] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const load = useCallback(async () => {
    setError("");
    try {
      setRows(await api<Planner[]>("/planners"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const modal = dialog.current;
    if (mode && modal && !modal.open) modal.showModal();
    if (!mode && modal?.open) modal.close();
  }, [mode]);
  function close() {
    if (!busy) {
      setMode(null);
      setError("");
    }
  }
  function open(planner: Planner, next: "rename" | "delete") {
    setTarget(planner);
    setName(planner.name);
    setError("");
    setMode(next);
  }
  async function apply(event: React.FormEvent) {
    event.preventDefault();
    if (!target || busy) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "rename") {
        await api(`/planners/${target.id}`, "PATCH", { name });
        setRows(
          (list) =>
            list?.map((p) =>
              p.id === target.id ? { ...p, name: name.trim() } : p,
            ) ?? null,
        );
      } else {
        await api(`/planners/${target.id}`, "DELETE");
        setRows((list) => list?.filter((p) => p.id !== target.id) ?? null);
      }
      setMode(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto flex h-[calc(min(100dvh,834px)-70px)] w-full max-w-[1194px] min-h-0 flex-col overflow-hidden bg-white p-7 text-[15px] leading-[1.6] text-[#222] [font-family:-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] [word-break:keep-all] selection:bg-[#222] selection:text-white [&_.text-xs]:leading-[1.6] [&_.text-sm]:leading-[1.6] [&_h1]:text-balance [&_button]:min-h-11 [&_button]:rounded-[3px] [&_button]:border [&_button]:border-[#d4d4d4] [&_button]:bg-white [&_button]:px-3.5 [&_button]:py-[9px] [&_button]:leading-[1.4] [&_button]:cursor-pointer [&_button:hover]:border-[#999] [&_button:hover]:bg-[#f3f3f3] [&_button:disabled]:cursor-default [&_button:disabled]:opacity-45 [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-3 [&_:focus-visible]:outline-[#222]">
      <header className="mb-7 flex shrink-0 items-center justify-between gap-6">
        <div>
          <h1 className="text-[30px] leading-[1.35] font-[650] tracking-[-1px]">
            내 플래너
          </h1>
          <p className="mt-2 text-[#666]">
            서로 다른 고민을 플래너로 나누고, 각각의 Plan A/B/C를 살펴보세요.
          </p>
        </div>
        <Link
          className="shrink-0 rounded-[3px] border border-[#222] bg-[#222] px-3.5 py-[9px] leading-[1.4] text-white hover:bg-[#444]"
          href="/interviews/new"
        >
          새 플래너 만들기
        </Link>
      </header>
      {error && !mode && (
        <div
          role="alert"
          className="mb-5 border border-[#555] bg-[#f0f0f0] p-3.5"
        >
          {error}{" "}
          <button type="button" onClick={load} disabled={busy}>
            목록 다시 불러오기
          </button>{" "}
          <Link
            className="underline underline-offset-4"
            href="/tmp/preview/implementation"
          >
            로그인·계정
          </Link>
        </div>
      )}
      {!rows && !error && (
        <p role="status" className="text-[#666]">
          목록을 불러오는 중입니다.
        </p>
      )}
      {rows?.length === 0 && (
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <h2 className="text-xl leading-[1.45] font-[650] tracking-[-.5px]">
            아직 플래너가 없습니다
          </h2>
          <p className="max-w-[48ch] text-[#666]">
            새 플래너 만들기를 눌러 인터뷰를 시작해보세요. 한 번의 인터뷰로 세
            가지 계획을 만들고, 다음 고민은 새 플래너에 담을 수 있습니다.
          </p>
        </section>
      )}
      {rows && rows.length > 0 && (
        <>
          <p className="shrink-0 pb-3 text-[13px] text-[#666]">
            총 {rows.length}개 · 최신 생성순
          </p>
          <ul
            aria-label="저장한 플래너"
            className="min-h-0 flex-1 overflow-auto border-t border-[#d4d4d4] pr-2 [scrollbar-color:#aaa_#f3f3f3] [scrollbar-width:thin]"
          >
            {rows.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-6 border-b border-[#ddd] py-[22px]"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl leading-[1.45] font-[650] tracking-[-.5px]">
                    <Link
                      aria-label={`${p.name} 열기`}
                      className="inline-block max-w-full rounded-[3px] border border-transparent p-2 [overflow-wrap:anywhere] hover:border-[#999] hover:bg-[#f3f3f3]"
                      href={`/planners/${p.id}`}
                    >
                      {p.name}
                    </Link>
                  </h2>
                  <p className="mx-2 text-[13px] text-[#666]">
                    {createdLabel(p.created_at)} 생성 · 계획 3개
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    aria-label={`${p.name} 이름 변경`}
                    disabled={busy}
                    onClick={() => open(p, "rename")}
                  >
                    이름 변경
                  </button>
                  <button
                    type="button"
                    className="border-transparent! bg-transparent! p-2! underline underline-offset-4"
                    aria-label={`${p.name} 삭제`}
                    disabled={busy}
                    onClick={() => open(p, "delete")}
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <footer className="mt-auto shrink-0 border-t border-[#d4d4d4] py-3 text-[13px] text-[#666]">
        본인 계정에 저장됩니다.
      </footer>
      <dialog
        ref={dialog}
        aria-labelledby="planner-dialog-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        className="m-auto max-h-[min(786px,calc(100dvh-48px))] w-[560px] max-w-[calc(100%-48px)] overflow-auto overscroll-contain rounded-[7px] border border-[#999] bg-white p-0 text-[#222] backdrop:bg-black/30"
      >
        {mode && (
          <div className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2
                id="planner-dialog-title"
                className="text-xl leading-[1.45] font-[650] tracking-[-.5px]"
              >
                {mode === "rename"
                  ? "플래너 이름 변경"
                  : "플래너를 삭제할까요?"}
              </h2>
              <button type="button" disabled={busy} onClick={close}>
                닫기
              </button>
            </div>
            <form onSubmit={apply}>
              <fieldset disabled={busy}>
                {mode === "rename" ? (
                  <label className="block text-[13px]">
                    플래너 이름
                    <input
                      required
                      maxLength={100}
                      pattern=".*\S.*"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 block min-h-11 w-full rounded-[3px] border border-[#aaa] bg-white p-[11px] text-[15px] caret-[#222]"
                    />
                  </label>
                ) : (
                  <p className="mb-5 text-sm text-[#555]">
                    {target?.name}의 Plan A/B/C와 모든 조각·평가가 함께
                    삭제됩니다. 보관된 음성 원본은 삭제되지 않습니다.
                  </p>
                )}
                {error && (
                  <p
                    role="alert"
                    className="mt-4 border border-[#555] bg-[#f0f0f0] p-3.5"
                  >
                    {error}
                  </p>
                )}
                <div className="mt-6 flex justify-between gap-2 border-t border-[#d4d4d4] pt-4">
                  <button type="button" onClick={close}>
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={mode === "rename" && !name.trim()}
                    className="ml-auto border-[#222]! bg-[#222]! text-white! hover:bg-[#444]!"
                  >
                    {busy
                      ? "저장 중…"
                      : mode === "rename"
                        ? "이름 저장"
                        : "플래너 삭제"}
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        )}
      </dialog>
    </main>
  );
}
