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
      <p className="mb-5 text-sm text-[#555] [overflow-wrap:anywhere]">
        ‘{sourceName}’의 사본 이름을 입력해주세요.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!pending && length >= 1 && length <= 100) submit(normalized);
        }}
      >
        <label
          className="mt-4 mb-1.5 block text-[13px]"
          htmlFor="planner-copy-name"
        >
          사본 이름
        </label>
        <input
          className="block w-full rounded-[3px] border border-[#aaa] bg-white px-3 py-2.5 leading-normal focus:border-[#222] focus:shadow-[0_0_0_1px_#222] focus:outline-none disabled:opacity-[0.45]"
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
        <p className="mt-2 text-xs text-[#666]" id="planner-copy-help">
          앞뒤 공백을 제외한 이름을 1~100자로 입력해주세요. ({length}/100자)
        </p>
        {message && (
          <p
            className="border border-[#555] bg-[#f0f0f0] p-3.5"
            role="alert"
            id="planner-copy-error"
          >
            {message}
          </p>
        )}
        <div className="mt-6 flex justify-between gap-2 border-t border-[#d4d4d4] pt-4">
          <button
            className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
            type="button"
            disabled={pending}
            onClick={close}
          >
            취소
          </button>
          <button
            type="submit"
            className="min-h-11 cursor-pointer rounded-[3px] border border-[#222] bg-[#222] px-3.5 py-[9px] leading-[1.4] text-white hover:border-[#999] hover:bg-[#444] hover:text-white focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] ml-auto"
            disabled={pending || !length || length > 100}
          >
            {pending ? "복제 중…" : "사본 만들기"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
