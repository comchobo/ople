"use client";

import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Piece } from "@/api/core";

type Drag = {
  id: string;
  mode: "move" | "start" | "end";
  x: number;
  y: number;
  width: number;
  piece: Piece;
  active: boolean;
  moved: boolean;
  pointer: number;
};
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

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
      const original = current.piece;
      const value = { ...original };
      if (current.mode === "move")
        value.start = clamp(original.start + delta, 0, 60 - original.duration);
      else if (current.mode === "start") {
        value.start = clamp(
          original.start + delta,
          0,
          original.start + original.duration - 1,
        );
        value.duration = original.start + original.duration - value.start;
      } else
        value.duration = clamp(
          original.duration + delta,
          1,
          60 - original.start,
        );
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
                        const value = { ...original };
                        if (mode === "start") {
                          value.start = clamp(
                            original.start + delta,
                            0,
                            original.start + original.duration - 1,
                          );
                          value.duration =
                            original.start + original.duration - value.start;
                        } else
                          value.duration = clamp(
                            original.duration + delta,
                            1,
                            60 - original.start,
                          );
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

export async function exportTimeline(pieces: Piece[], filename: string) {
  await document.fonts.ready;
  const scale = 2,
    width = 1200,
    height = 38 + Math.max(1, pieces.length) * 54;
  if (height * width * scale * scale > 64_000_000)
    throw new Error("타임라인이 너무 커서 이미지로 저장할 수 없습니다.");
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지를 생성할 수 없습니다.");
  context.scale(scale, scale);
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.font = "12px sans-serif";
  context.textBaseline = "middle";
  for (let year = 0; year < 5; year++) {
    context.strokeStyle = "#ddd";
    context.beginPath();
    context.moveTo((year * width) / 5, 0);
    context.lineTo((year * width) / 5, height);
    context.stroke();
    context.fillStyle = "#555";
    context.fillText(`${year + 1}년차`, (year * width) / 5 + 8, 19);
  }
  pieces.forEach((piece, index) => {
    const y = 38 + index * 54,
      left = (piece.start / 60) * width,
      span = (piece.duration / 60) * width;
    context.strokeStyle = "#e5e5e5";
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
    context.fillStyle = "#ececec";
    context.fillRect(left, y + 5, span, 44);
    context.strokeStyle = "#999";
    context.strokeRect(left + 0.5, y + 5.5, span - 1, 43);
    context.save();
    context.beginPath();
    context.rect(left + 4, y + 6, Math.max(0, span - 8), 42);
    context.clip();
    context.fillStyle = "#222";
    context.font = "12px sans-serif";
    context.fillText(piece.title, left + 6, y + 20);
    context.font = "10px sans-serif";
    context.fillText(
      `${piece.start + 1}개월차부터 · ${piece.duration}개월`,
      left + 6,
      y + 36,
    );
    context.restore();
  });
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value
          ? resolve(value)
          : reject(new Error("이미지 생성에 실패했습니다.")),
      "image/png",
    ),
  );
  const url = URL.createObjectURL(blob),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename.replace(/[\\/:*?"<>|]/g, "_")}.png`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
