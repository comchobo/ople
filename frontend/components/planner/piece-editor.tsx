"use client";

import { useState } from "react";
import type { Category, Piece } from "@/api/core";
import { Button } from "@/components/button";
import { controlClass, Field } from "@/components/field";
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
        <Field label="활동 제목" htmlFor="piece-title">
          <input
            className={controlClass}
            id="piece-title"
            required
            maxLength={100}
            value={value.title}
            onChange={(e) => setValue({ ...value, title: e.target.value })}
          />
        </Field>
        <Field label="설명 (선택)" htmlFor="piece-description">
          <textarea
            className={controlClass}
            id="piece-description"
            rows={3}
            maxLength={2000}
            value={value.description}
            onChange={(e) =>
              setValue({ ...value, description: e.target.value })
            }
          />
        </Field>
        <Field label="카테고리" htmlFor="category">
          <select
            className={controlClass}
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
        </Field>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Field label="시작 월" htmlFor="start" spacing={false}>
            <input
              className={controlClass}
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
          </Field>
          <Field label="기간 (개월)" htmlFor="duration" spacing={false}>
            <input
              className={controlClass}
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
          </Field>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
          {remove && (
            <Button
              variant="danger"
              className="px-2"
              onClick={() => {
                if (window.confirm("이 활동을 삭제할까요?")) remove();
              }}
            >
              삭제
            </Button>
          )}
          {duplicate && (
            <Button variant="secondary" onClick={duplicate}>
              복제
            </Button>
          )}
          <Button
            variant="primary"
            className="ml-auto"
            type="submit"
            disabled={!value.title.trim()}
          >
            저장
          </Button>
        </div>
      </form>
    </Modal>
  );
}
