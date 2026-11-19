"use client";

import { useState } from "react";
import type { Planner } from "@/api/core";
import { Modal } from "./modal";

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
        <label className="field" htmlFor="planner-name">
          이름
        </label>
        <input
          id="planner-name"
          required
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="sheet-footer">
          <button type="submit" className="primary" disabled={!name.trim()}>
            변경
          </button>
        </div>
      </form>
    </Modal>
  );
}
