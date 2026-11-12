"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { changeRange, monthLabel, type Piece } from "../../lib/product";

type Gesture = {
  piece: Piece;
  mode: string;
  x: number;
  y: number;
  cell: number;
  active: boolean;
  moved: boolean;
  target: HTMLElement;
  pointer: number;
};

export function Timeline({
  pieces,
  start,
  disabled,
  edit,
  save,
}: {
  pieces: Piece[];
  start: string;
  disabled: boolean;
  edit: (piece: Piece) => void;
  save: (piece: Piece) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<Piece | null>(null);
  const previewRef = useRef<Piece | null>(null);

  const clearGesture = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    const current = gesture.current;
    gesture.current = null;
    if (current?.target.hasPointerCapture(current.pointer))
      current.target.releasePointerCapture(current.pointer);
    previewRef.current = null;
    setPreview(null);
  }, []);
  useEffect(() => {
    const clear = () => {
      clearGesture();
      setSelected(null);
    };
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) clear();
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") clear();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", onEscape);
    window.addEventListener("blur", clear);
    return () => {
      clearGesture();
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", onEscape);
      window.removeEventListener("blur", clear);
    };
  }, [clearGesture]);

  function down(
    e: React.PointerEvent<HTMLElement>,
    piece: Piece,
    mode: string,
  ) {
    if (disabled || e.button !== 0) return;
    const target = e.currentTarget;
    const cell =
      (root.current
        ?.querySelector("[data-timeline-track]")
        ?.getBoundingClientRect().width ?? 840) / 60;
    const current: Gesture = {
      piece,
      mode,
      x: e.clientX,
      y: e.clientY,
      cell,
      active: selected === piece.id,
      moved: false,
      target,
      pointer: e.pointerId,
    };
    gesture.current = current;
    const activate = () => {
      current.active = true;
      setSelected(piece.id);
      target.setPointerCapture(current.pointer);
    };
    if (current.active || mode !== "move") activate();
    else timer.current = setTimeout(activate, 450);
  }
  function move(e: React.PointerEvent) {
    const current = gesture.current;
    if (!current) return;
    if (!current.active) {
      if (Math.hypot(e.clientX - current.x, e.clientY - current.y) > 8)
        clearGesture();
      return;
    }
    const delta = Math.round((e.clientX - current.x) / current.cell);
    current.moved = current.moved || delta !== 0;
    const next = {
      ...current.piece,
      ...changeRange(
        current.piece.start_month,
        current.piece.duration,
        delta,
        current.mode,
      ),
    };
    previewRef.current = next;
    setPreview(next);
  }
  function up() {
    const current = gesture.current;
    const next = previewRef.current;
    if (current?.active && current.moved && next) save(next);
    else if (current && !current.active) edit(current.piece);
    clearGesture();
  }
  return (
    <div ref={root}>
      <p id="timeline-instructions" className="sr-only">
        조각을 짧게 누르면 편집합니다. 길게 눌러 선택한 뒤 이동하거나 양 끝을
        조절하세요. 폼으로도 같은 변경을 할 수 있습니다.
      </p>
      <section
        aria-label="5년 활동 타임라인"
        aria-describedby="timeline-instructions"
        className="overflow-x-auto overscroll-x-contain border border-[#bbb] bg-white [touch-action:pan-x_pan-y]"
      >
        <div data-timeline-track className="relative min-w-full">
          <div className="grid h-[38px] grid-cols-5 border-b border-[#ccc] text-[11px] text-[#555]">
            {[1, 13, 25, 37, 49].map((month) => (
              <span
                key={month}
                className="border-l border-[#ddd] px-[7px] py-2.5 first:border-l-0"
              >
                {monthLabel(start, month)}
              </span>
            ))}
          </div>
          {pieces.map((original) => {
            const piece = preview?.id === original.id ? preview : original;
            const active = selected === piece.id;
            return (
              <div
                key={piece.id}
                className="relative h-[54px] border-b border-[#e5e5e5] last:border-b-0 bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(20%-1px),#eee_calc(20%-1px),#eee_20%)]"
              >
                <div
                  className={`absolute top-[5px] h-11 min-w-0 touch-pan-y select-none rounded-[2px] border ${active ? "z-[3] touch-none! border-2 border-[#222] bg-[#ddd]" : "border-[#999] bg-[#ececec]"}`}
                  data-selected={active}
                  data-category={piece.category}
                  title={`${piece.title} · ${piece.start_month}개월째부터 ${piece.duration}개월`}
                  style={{
                    left: `${((piece.start_month - 1) / 60) * 100}%`,
                    width: `${(piece.duration / 60) * 100}%`,
                  }}
                >
                  {active && (
                    <button
                      type="button"
                      className="absolute -top-1 -bottom-1 -left-2 z-[4] w-6 touch-none rounded-none! border-[#333]! bg-white! p-0! after:absolute after:top-[13px] after:bottom-[13px] after:left-[9px] after:w-0.5 after:bg-[#777]"
                      aria-label={`${piece.title} 시작 조절`}
                      disabled={disabled}
                      onPointerDown={(e) => down(e, piece, "start")}
                      onPointerMove={move}
                      onPointerUp={up}
                      onPointerCancel={clearGesture}
                      onLostPointerCapture={clearGesture}
                      onClick={(e) => {
                        if (e.detail === 0) edit(piece);
                      }}
                    />
                  )}
                  <button
                    type="button"
                    className={`block h-full w-full min-h-0! overflow-hidden rounded-none! border-0! bg-transparent! py-[5px]! pr-[27px]! pl-1.5! text-left text-xs! text-ellipsis whitespace-nowrap ${active ? "touch-none cursor-grab! pr-9!" : "touch-pan-y"}`}
                    disabled={disabled}
                    aria-label={`${piece.title}, ${piece.category}, ${piece.start_month}개월째부터 ${piece.duration}개월, 편집`}
                    onPointerDown={(e) => down(e, piece, "move")}
                    onPointerMove={move}
                    onPointerUp={up}
                    onPointerCancel={clearGesture}
                    onLostPointerCapture={clearGesture}
                    onClick={(e) => {
                      if (e.detail === 0) edit(piece);
                    }}
                  >
                    <small className="block text-[10px] leading-[1.1] text-[#555]">
                      {piece.category}
                    </small>
                    {piece.title}
                  </button>
                  {piece.duration >= 6 && (
                    <button
                      type="button"
                      aria-label={`${piece.title} 편집 아이콘`}
                      disabled={disabled}
                      className={`absolute top-0 h-[42px] min-h-0! w-7 rounded-none! border-0! bg-white/50! p-0! ${active ? "right-[15px]" : "right-0"}`}
                      onClick={() => edit(piece)}
                    >
                      <svg
                        className="mx-auto"
                        viewBox="0 0 24 24"
                        width="15"
                        height="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15Z" />
                      </svg>
                    </button>
                  )}
                  {active && (
                    <button
                      type="button"
                      className="absolute -top-1 -bottom-1 -right-2 z-[4] w-6 touch-none rounded-none! border-[#333]! bg-white! p-0! after:absolute after:top-[13px] after:bottom-[13px] after:left-[9px] after:w-0.5 after:bg-[#777]"
                      aria-label={`${piece.title} 종료 조절`}
                      disabled={disabled}
                      onPointerDown={(e) => down(e, piece, "end")}
                      onPointerMove={move}
                      onPointerUp={up}
                      onPointerCancel={clearGesture}
                      onLostPointerCapture={clearGesture}
                      onClick={(e) => {
                        if (e.detail === 0) edit(piece);
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
          {pieces.length === 0 && (
            <p className="p-3.5 text-[13px] text-[#666]">
              활동 조각을 추가해보세요.
            </p>
          )}
        </div>
      </section>
      <p className="sr-only">
        {monthLabel(start, 1)}–{monthLabel(start, 60)} · 활동은 겹칠 수
        있습니다.
      </p>
    </div>
  );
}
