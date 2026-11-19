"use client";

import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Piece } from "@/api/core";

type Adjustment = "move" | "start" | "end";
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
      className="overflow-x-auto overscroll-x-contain border border-[#bbb] bg-white [touch-action:pan-x_pan-y]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) setSelected(null);
      }}
    >
      <div id="timeline-track" ref={track}>
        <div className="grid h-[38px] grid-cols-5 border-b border-[#ccc] text-[11px] text-[#555]">
          {[1, 2, 3, 4, 5].map((year) => (
            <span
              className="border-l border-[#ddd] px-[7px] py-2.5 first:border-l-0"
              key={year}
            >
              {year}년차
            </span>
          ))}
        </div>
        {pieces.map((original) => {
          const piece = preview?.id === original.id ? preview : original;
          return (
            <div
              className="relative h-[54px] border-b border-[#e5e5e5] bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(20%_-_1px),#eee_calc(20%_-_1px),#eee_20%)] last:border-b-0"
              key={piece.id}
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) setSelected(null);
              }}
            >
              <div
                className={
                  selected === piece.id
                    ? "absolute top-[5px] z-[3] h-11 min-w-0 rounded-[2px] border-2 border-[#222] bg-[#ddd] select-none [touch-action:none]"
                    : "absolute top-[5px] h-11 min-w-0 rounded-[2px] border border-[#999] bg-[#ececec] select-none [touch-action:pan-y]"
                }
                style={{
                  left: `${(piece.start / 60) * 100}%`,
                  width: `${(piece.duration / 60) * 100}%`,
                }}
              >
                <button
                  className={`block h-full w-full min-h-0 overflow-hidden rounded-none border-0 bg-transparent pt-[5px] pr-[27px] pb-1 pl-1.5 text-left text-xs leading-[1.4] text-ellipsis whitespace-nowrap hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] ${selected === piece.id ? "cursor-grab" : "cursor-pointer"}`}
                  type="button"
                  onPointerDown={(event) => begin(event, original, "move")}
                  onClick={() => {
                    if (!suppressedClick.current) edit(original);
                    suppressedClick.current = false;
                  }}
                >
                  {piece.title}
                  <small className="block text-[10px] leading-[1.1] text-[#555]">
                    {piece.start + 1}개월차부터 · {piece.duration}개월
                  </small>
                </button>
                <button
                  className={`absolute top-0 h-[42px] w-7 min-h-0 cursor-pointer rounded-none border-0 bg-[rgba(255,255,255,0.5)] p-0 text-sm leading-[1.4] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] ${selected === piece.id ? "right-[15px]" : "right-0"}`}
                  type="button"
                  aria-label={`${piece.title} 수정`}
                  onClick={() => edit(original)}
                >
                  <Pencil className="size-[15px]" />
                </button>
                {selected === piece.id &&
                  (["start", "end"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`absolute -top-1 -bottom-1 z-[4] w-6 min-h-0 cursor-pointer rounded-[3px] border border-[#333] bg-white p-0 [touch-action:none] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] after:absolute after:top-[13px] after:bottom-[13px] after:left-[9px] after:w-0.5 after:bg-[#777] after:content-[''] ${mode === "start" ? "-left-2" : "-right-2"}`}
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
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
