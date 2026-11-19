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
      className="timeline-viewport"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) setSelected(null);
      }}
    >
      <div id="timeline-track" ref={track}>
        <div className="timeline-years">
          {[1, 2, 3, 4, 5].map((year) => (
            <span key={year}>{year}년차</span>
          ))}
        </div>
        {!pieces.length && (
          <p className="timeline-empty">
            아직 활동이 없어요. 활동을 추가해 5년의 흐름을 그려보세요.
          </p>
        )}
        {pieces.map((original) => {
          const piece = preview?.id === original.id ? preview : original;
          return (
            <div
              className="timeline-row"
              key={piece.id}
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) setSelected(null);
              }}
            >
              <div
                className={`piece ${selected === piece.id ? "selected" : ""}`}
                style={{
                  left: `${(piece.start / 60) * 100}%`,
                  width: `${(piece.duration / 60) * 100}%`,
                }}
              >
                <button
                  className="piece-main"
                  type="button"
                  onPointerDown={(event) => begin(event, original, "move")}
                  onClick={() => {
                    if (!suppressedClick.current) edit(original);
                    suppressedClick.current = false;
                  }}
                >
                  {piece.title}
                  <small>
                    {piece.start + 1}개월차부터 · {piece.duration}개월
                  </small>
                </button>
                <button
                  className="piece-edit"
                  type="button"
                  aria-label={`${piece.title} 수정`}
                  onClick={() => edit(original)}
                >
                  <Pencil />
                </button>
                {selected === piece.id &&
                  (["start", "end"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`resize-handle ${mode}`}
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
