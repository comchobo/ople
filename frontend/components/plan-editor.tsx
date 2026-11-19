"use client";

import { useState } from "react";
import type { Plan } from "@/api/core";
import { Modal } from "./modal";

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
        <p className="muted">{plan.kind}</p>
        <label className="field" htmlFor="plan-title">
          제목
        </label>
        <input
          id="plan-title"
          required
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="field" htmlFor="plan-description">
          설명
        </label>
        <textarea
          id="plan-description"
          rows={5}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="sheet-footer">
          <button className="primary" disabled={!title.trim()} type="submit">
            저장
          </button>
        </div>
      </form>
    </Modal>
  );
}
