"use client";

import { useState } from "react";
import type { Planner } from "@/api/core";
import { Modal } from "@/components/modal";

export function PlannerNameEditor({
  planner,
  save,
  close,
}: {
  planner: Planner;
  save: (planner: Planner) => void;
  close: () => void;
}) {
  const [name, setName] = useState(planner.name);
  return (
    <Modal title="플래너 이름 변경" close={close}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save({ ...planner, name: name.trim() });
        }}
      >
        <label className="mt-4 mb-1.5 block text-[13px]" htmlFor="planner-name">
          이름
        </label>
        <input
          className="block min-h-11 w-full rounded-[3px] border border-[#aaa] bg-white p-[11px] caret-[#222] focus:[outline:2px_solid_#555] focus:[outline-offset:1px]"
          id="planner-name"
          required
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="mt-6 flex justify-between gap-2 border-t border-[#d4d4d4] pt-4">
          <button
            type="submit"
            className="min-h-11 cursor-pointer rounded-[3px] border border-[#222] bg-[#222] px-3.5 py-[9px] leading-[1.4] text-white hover:border-[#999] hover:bg-[#444] hover:text-white focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] ml-auto"
            disabled={!name.trim()}
          >
            변경
          </button>
        </div>
      </form>
    </Modal>
  );
}
