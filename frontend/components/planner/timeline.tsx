"use client";

import { useEffect, useRef, useState } from "react";
import type { Category, Piece } from "@/api/core";

type Adjustment = "move" | "start" | "end";

const categoryStyles: Record<
  Category,
  { edge: string; soft: string; dot: string }
> = {
  work: {
    edge: "border-l-work",
    soft: "bg-work-soft",
    dot: "bg-work",
  },
  creative: {
    edge: "border-l-creative",
    soft: "bg-creative-soft",
    dot: "bg-creative",
  },
  relation: {
    edge: "border-l-relation",
    soft: "bg-relation-soft",
    dot: "bg-relation",
  },
  rest: {
    edge: "border-l-rest",
    soft: "bg-rest-soft",
    dot: "bg-rest",
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

function adjustPiece(piece: Piece, mode: Adjustment, delta: number): Piece {
  if (mode === "move")
    return {
      ...piece,
      start: clamp(piece.start + delta, 0, 60 - piece.duration),
    };
  if (mode === "start") {
    const start = clamp(
      piece.start + delta,
      0,
      piece.start + piece.duration - 1,
    );
    return { ...piece, start, duration: piece.start + piece.duration - start };
  }
  return {
    ...piece,
    duration: clamp(piece.duration + delta, 1, 60 - piece.start),
  };
}

type Drag = {
  id: string;
  mode: Adjustment;
  x: number;
  y: number;
  width: number;
  piece: Piece;
  active: boolean;
  moved: boolean;
  pointer: number;
};

export function Timeline({
  pieces,
  change,
  edit,
}: {
  pieces: Piece[];
  change: (pieces: Piece[]) => void;
  edit: (piece: Piece) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<Piece | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const piecesRef = useRef(pieces);
  piecesRef.current = pieces;
  const changeRef = useRef(change);
  changeRef.current = change;
  const previewRef = useRef<Piece | null>(null);
  const suppressedClick = useRef(false);
  useEffect(() => {
    function finish() {
      if (timer.current) clearTimeout(timer.current);
      const current = drag.current;
      if (!current) return;
      suppressedClick.current = current.moved || current.active;
      if (previewRef.current) {
        const value = previewRef.current;
        changeRef.current(
          piecesRef.current.map((piece) =>
            piece.id === value.id ? value : piece,
          ),
        );
      }
      drag.current = null;
      previewRef.current = null;
      setPreview(null);
    }
    function move(event: PointerEvent) {
      const current = drag.current;
      if (!current || event.pointerId !== current.pointer) return;
      const distance = event.clientX - current.x;
      if (!current.active) {
        if (Math.abs(distance) > 8 || Math.abs(event.clientY - current.y) > 8) {
          if (timer.current) clearTimeout(timer.current);
          drag.current = null;
        }
        return;
      }
      event.preventDefault();
      const delta = Math.round((distance / current.width) * 60);
      const value = adjustPiece(current.piece, current.mode, delta);
      current.moved = current.moved || delta !== 0;
      previewRef.current = value;
      setPreview(value);
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        finish();
        setSelected(null);
      }
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("blur", finish);
    window.addEventListener("keydown", handleEscape);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      window.removeEventListener("blur", finish);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);
  function begin(event: React.PointerEvent, piece: Piece, mode: Drag["mode"]) {
    if (event.button !== 0) return;
    event.stopPropagation();
    suppressedClick.current = false;
    const active = selected === piece.id || mode !== "move";
    drag.current = {
      id: piece.id,
      mode,
      piece,
      x: event.clientX,
      y: event.clientY,
      width: track.current?.getBoundingClientRect().width || 1,
      active,
      moved: false,
      pointer: event.pointerId,
    };
    if (active) {
      event.preventDefault();
      setSelected(piece.id);
    } else
      timer.current = setTimeout(() => {
        if (drag.current) {
          drag.current.active = true;
          setSelected(piece.id);
        }
      }, 450);
  }
  return (
    <div
      className="overflow-x-auto overscroll-x-contain border border-rule-strong bg-paper-raised [touch-action:pan-x_pan-y]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) setSelected(null);
      }}
    >
      <div id="timeline-track" ref={track} className="min-w-[600px]">
        <div className="grid h-10 grid-cols-5 border-b border-rule-strong bg-paper-deep/60 font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
          {[1, 2, 3, 4, 5].map((year) => (
            <span
              className="border-l border-rule px-2 py-2.5 first:border-l-0"
              key={year}
            >
              {year}년차
            </span>
          ))}
        </div>
        {pieces.map((original) => {
          const piece = preview?.id === original.id ? preview : original;
          const style = categoryStyles[piece.category];
          return (
            <div
              className="relative h-14 border-b border-rule bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(20%_-_1px),#e4ded2_calc(20%_-_1px),#e4ded2_20%)] last:border-b-0"
              key={piece.id}
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) setSelected(null);
              }}
            >
              <div
                className={[
                  "absolute top-[6px] h-11 min-w-0 rounded-[1px] border border-l-[3px] border-rule-strong select-none",
                  style.edge,
                  style.soft,
                  selected === piece.id
                    ? "z-[3] ring-2 ring-ink ring-offset-1 ring-offset-paper-raised [touch-action:none]"
                    : "[touch-action:pan-x_pan-y] hover:border-ink",
                ].join(" ")}
                style={{
                  left: `${(piece.start / 60) * 100}%`,
                  width: `${(piece.duration / 60) * 100}%`,
                }}
              >
                <button
                  className={`block h-full w-full min-h-0 overflow-hidden rounded-none border-0 bg-transparent pt-1.5 pr-2 pb-1 pl-2 text-left text-[11px] leading-[1.35] text-ellipsis whitespace-nowrap text-ink hover:bg-paper-deep/60 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink ${selected === piece.id ? "cursor-grab" : "cursor-pointer"}`}
                  type="button"
                  onPointerDown={(event) => begin(event, original, "move")}
                  onClick={() => {
                    if (!suppressedClick.current) edit(original);
                    suppressedClick.current = false;
                  }}
                >
                  <span
                    aria-hidden="true"
                    className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${style.dot}`}
                  />
                  {piece.title}
                  <small className="block text-[10px] leading-[1.2] text-ink-soft">
                    {piece.start + 1}개월차부터 · {piece.duration}개월
                  </small>
                  <span className="sr-only"> 수정</span>
                </button>
                {selected === piece.id &&
                  (["start", "end"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`absolute -top-1 -bottom-1 z-[4] flex w-11 min-h-0 cursor-pointer items-center justify-center rounded-[1px] border border-ink bg-paper-raised p-0 [touch-action:none] hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink ${mode === "start" ? "-left-5" : "-right-5"}`}
                      aria-label={`${piece.title} ${mode === "start" ? "시작" : "종료"} 조절`}
                      onPointerDown={(event) => begin(event, original, mode)}
                      onKeyDown={(event) => {
                        if (!["ArrowLeft", "ArrowRight"].includes(event.key))
                          return;
                        event.preventDefault();
                        const delta = event.key === "ArrowRight" ? 1 : -1;
                        const value = adjustPiece(original, mode, delta);
                        change(
                          pieces.map((item) =>
                            item.id === value.id ? value : item,
                          ),
                        );
                      }}
                    >
                      <span className="h-5 w-0.5 bg-ink" />
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
