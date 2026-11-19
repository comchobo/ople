"use client";

import { useState } from "react";
import type { Category, Piece } from "@/api/core";
import { Modal } from "./modal";

const categories: Record<Category, string> = {
  work: "일",
  creative: "창작",
  relation: "관계",
  rest: "휴식",
};

export function PieceEditor({
  piece,
  save,
  remove,
  duplicate,
  close,
}: {
  piece: Piece;
  save: (piece: Piece) => void;
  remove?: () => void;
  duplicate?: () => void;
  close: () => void;
}) {
  const [value, setValue] = useState(piece);
  return (
    <Modal title={remove ? "활동 수정" : "활동 추가"} close={close}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save({ ...value, title: value.title.trim() });
        }}
      >
        <label className="field" htmlFor="piece-title">
          활동 제목
        </label>
        <input
          id="piece-title"
          required
          maxLength={100}
          value={value.title}
          onChange={(e) => setValue({ ...value, title: e.target.value })}
        />
        <label className="field" htmlFor="piece-description">
          설명 (선택)
        </label>
        <textarea
          id="piece-description"
          rows={3}
          maxLength={2000}
          value={value.description}
          onChange={(e) => setValue({ ...value, description: e.target.value })}
        />
        <label className="field" htmlFor="category">
          카테고리
        </label>
        <select
          id="category"
          value={value.category}
          onChange={(e) =>
            setValue({ ...value, category: e.target.value as Category })
          }
        >
          {Object.entries(categories).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <div className="form-grid">
          <div>
            <label className="field" htmlFor="start">
              시작 월
            </label>
            <input
              id="start"
              type="number"
              min={1}
              max={60}
              required
              value={value.start + 1}
              onChange={(e) => {
                const start = Math.max(
                  0,
                  Math.min(59, Number(e.target.value) - 1),
                );
                setValue({
                  ...value,
                  start,
                  duration: Math.min(value.duration, 60 - start),
                });
              }}
            />
          </div>
          <div>
            <label className="field" htmlFor="duration">
              기간 (개월)
            </label>
            <input
              id="duration"
              type="number"
              min={1}
              max={60 - value.start}
              required
              value={value.duration}
              onChange={(e) =>
                setValue({ ...value, duration: Number(e.target.value) })
              }
            />
          </div>
        </div>
        <div className="sheet-footer">
          {remove && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("이 활동을 삭제할까요?")) remove();
              }}
            >
              삭제
            </button>
          )}
          {duplicate && (
            <button type="button" onClick={duplicate}>
              복제
            </button>
          )}
          <button
            className="primary"
            type="submit"
            disabled={!value.title.trim()}
          >
            저장
          </button>
        </div>
      </form>
    </Modal>
  );
}
