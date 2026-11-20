"use client";

import { useState } from "react";
import type { Plan } from "@/api/core";
import { Button } from "@/components/button";
import { controlClass, Field } from "@/components/field";
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
        <p className="folio mb-5">{plan.kind}</p>
        <Field label="제목" htmlFor="plan-title">
          <input
            className={controlClass}
            id="plan-title"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="설명" htmlFor="plan-description">
          <textarea
            className={controlClass}
            id="plan-description"
            rows={5}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="mt-7 border-t border-rule pt-4">
          <Button
            variant="primary"
            className="ml-auto flex"
            disabled={!title.trim()}
            type="submit"
          >
            저장
          </Button>
        </div>
      </form>
    </Modal>
  );
}
