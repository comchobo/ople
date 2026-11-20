"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";

function initialCopyName(sourceName: string, existingNames: string[]) {
  const used = new Set(existingNames);
  let name = `${sourceName}(사본)`;
  while (used.has(name)) name += "(사본)";
  return name;
}

export function PlannerCopyNameDialog({
  sourceName,
  existingNames,
  pending,
  error,
  submit,
  close,
}: {
  sourceName: string;
  existingNames: string[];
  pending: boolean;
  error: Error | null;
  submit: (name: string) => void;
  close: () => void;
}) {
  const [name, setName] = useState(() =>
    initialCopyName(sourceName, existingNames),
  );
  const [hiddenError, setHiddenError] = useState<Error | null>(null);
  const normalized = name.trim();
  const length = Array.from(normalized).length;
  const message = !length
    ? "이름을 입력해주세요."
    : length > 100
      ? "길이가 초과됩니다."
      : error !== hiddenError
        ? error?.message
        : undefined;

  return (
    <Modal title="사본 이름 입력" close={close} dismissible={!pending}>
      <p className="sheet-copy planner-copy-source">
        ‘{sourceName}’의 사본 이름을 입력해주세요.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!pending && length >= 1 && length <= 100) submit(normalized);
        }}
      >
        <label className="field" htmlFor="planner-copy-name">
          사본 이름
        </label>
        <input
          id="planner-copy-name"
          value={name}
          disabled={pending}
          required
          aria-invalid={Boolean(message)}
          aria-describedby={
            message
              ? "planner-copy-help planner-copy-error"
              : "planner-copy-help"
          }
          onChange={(event) => {
            setName(event.target.value);
            setHiddenError(error);
          }}
        />
        <p className="copy-name-help" id="planner-copy-help">
          앞뒤 공백을 제외한 이름을 1~100자로 입력해주세요. ({length}/100자)
        </p>
        {message && (
          <p className="error" role="alert" id="planner-copy-error">
            {message}
          </p>
        )}
        <div className="sheet-footer">
          <button type="button" disabled={pending} onClick={close}>
            취소
          </button>
          <button
            type="submit"
            className="primary"
            disabled={pending || !length || length > 100}
          >
            {pending ? "복제 중…" : "사본 만들기"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
