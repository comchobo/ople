"use client";

import { useState } from "react";
import type { Category, Piece } from "@/api/core";
import { Modal } from "@/components/modal";

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
        <label className="mt-4 mb-1.5 block text-[13px]" htmlFor="piece-title">
          활동 제목
        </label>
        <input
          className="block min-h-11 w-full rounded-[3px] border border-[#aaa] bg-white p-[11px] caret-[#222] focus:[outline:2px_solid_#555] focus:[outline-offset:1px]"
          id="piece-title"
          required
          maxLength={100}
          value={value.title}
          onChange={(e) => setValue({ ...value, title: e.target.value })}
        />
        <label
          className="mt-4 mb-1.5 block text-[13px]"
          htmlFor="piece-description"
        >
          설명 (선택)
        </label>
        <textarea
          className="block min-h-11 w-full rounded-[3px] border border-[#aaa] bg-white p-[11px] caret-[#222] focus:[outline:2px_solid_#555] focus:[outline-offset:1px]"
          id="piece-description"
          rows={3}
          maxLength={2000}
          value={value.description}
          onChange={(e) => setValue({ ...value, description: e.target.value })}
        />
        <label className="mt-4 mb-1.5 block text-[13px]" htmlFor="category">
          카테고리
        </label>
        <select
          className="block min-h-11 w-full rounded-[3px] border border-[#aaa] bg-white p-[11px] caret-[#222] focus:[outline:2px_solid_#555] focus:[outline-offset:1px]"
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mt-4 mb-1.5 block text-[13px]" htmlFor="start">
              시작 월
            </label>
            <input
              className="block min-h-11 w-full rounded-[3px] border border-[#aaa] bg-white p-[11px] caret-[#222] focus:[outline:2px_solid_#555] focus:[outline-offset:1px]"
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
            <label className="mt-4 mb-1.5 block text-[13px]" htmlFor="duration">
              기간 (개월)
            </label>
            <input
              className="block min-h-11 w-full rounded-[3px] border border-[#aaa] bg-white p-[11px] caret-[#222] focus:[outline:2px_solid_#555] focus:[outline-offset:1px]"
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
        <div className="mt-6 flex justify-between gap-2 border-t border-[#d4d4d4] pt-4">
          {remove && (
            <button
              className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
              type="button"
              onClick={() => {
                if (window.confirm("이 활동을 삭제할까요?")) remove();
              }}
            >
              삭제
            </button>
          )}
          {duplicate && (
            <button
              className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
              type="button"
              onClick={duplicate}
            >
              복제
            </button>
          )}
          <button
            className="min-h-11 cursor-pointer rounded-[3px] border border-[#222] bg-[#222] px-3.5 py-[9px] leading-[1.4] text-white hover:border-[#999] hover:bg-[#444] hover:text-white focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] ml-auto"
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
