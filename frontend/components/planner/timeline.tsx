"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { changeRange, monthLabel, type Piece } from "../../lib/product";
import s from "./feature.module.css";

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
      (root.current?.querySelector(`.${s.track}`)?.getBoundingClientRect()
        .width ?? 840) / 60;
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
      <p className={s.muted}>
        조각을 짧게 누르면 편집합니다. 길게 눌러 선택한 뒤 이동하거나 양 끝을
        조절하세요. 폼으로도 같은 변경을 할 수 있습니다.
      </p>
      <div className={s.timeline}>
        <div className={s.track}>
          <div className={s.years}>
            {[1, 13, 25, 37, 49].map((month) => (
              <span key={month}>{monthLabel(start, month)}부터</span>
            ))}
          </div>
          {pieces.map((original) => {
            const piece = preview?.id === original.id ? preview : original;
            const active = selected === piece.id;
            return (
              <div key={piece.id} className={s.lane}>
                <div
                  className={s.piece}
                  data-selected={active}
                  data-category={piece.category}
                  style={{
                    left: `${((piece.start_month - 1) / 60) * 100}%`,
                    width: `${(piece.duration / 60) * 100}%`,
                  }}
                >
                  {active && (
                    <button
                      type="button"
                      className={s.handle}
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
                    className={s.pieceBody}
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
                    {piece.title}
                    <br />
                    {piece.category} · {piece.start_month}–
                    {piece.start_month + piece.duration - 1}개월
                  </button>
                  {active && (
                    <button
                      type="button"
                      className={s.handle}
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
            <p className={s.notice}>활동 조각을 추가해보세요.</p>
          )}
        </div>
      </div>
      <p className={s.muted}>
        {monthLabel(start, 1)}–{monthLabel(start, 60)} · 활동은 겹칠 수
        있습니다.
      </p>
    </div>
  );
}
