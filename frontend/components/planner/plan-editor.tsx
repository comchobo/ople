"use client";

import { useState } from "react";
import type { Plan } from "@/api/core";
import { Modal } from "@/components/modal";

export function PlanEditor({
  plan,
  save,
  close,
}: {
  plan: Plan;
  save: (plan: Plan) => void;
  close: () => void;
}) {
  const [title, setTitle] = useState(plan.title);
  const [description, setDescription] = useState(plan.description);
  return (
    <Modal title="플랜 수정" close={close}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save({ ...plan, title: title.trim(), description });
        }}
      >
        <p className="text-[#666]">{plan.kind}</p>
        <label className="mt-4 mb-1.5 block text-[13px]" htmlFor="plan-title">
          제목
        </label>
        <input
          className="block min-h-11 w-full rounded-[3px] border border-[#aaa] bg-white p-[11px] caret-[#222] focus:[outline:2px_solid_#555] focus:[outline-offset:1px]"
          id="plan-title"
          required
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label
          className="mt-4 mb-1.5 block text-[13px]"
          htmlFor="plan-description"
        >
          설명
        </label>
        <textarea
          className="block min-h-11 w-full rounded-[3px] border border-[#aaa] bg-white p-[11px] caret-[#222] focus:[outline:2px_solid_#555] focus:[outline-offset:1px]"
          id="plan-description"
          rows={5}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="mt-6 flex justify-between gap-2 border-t border-[#d4d4d4] pt-4">
          <button
            className="min-h-11 cursor-pointer rounded-[3px] border border-[#222] bg-[#222] px-3.5 py-[9px] leading-[1.4] text-white hover:border-[#999] hover:bg-[#444] hover:text-white focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] ml-auto"
            disabled={!title.trim()}
            type="submit"
          >
            저장
          </button>
        </div>
      </form>
    </Modal>
  );
}
