"use client";

import { useState } from "react";
import type { Planner } from "@/api/core";
import { Button } from "@/components/button";
import { controlClass, Field } from "@/components/field";
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
        <Field label="이름" htmlFor="planner-name">
          <input
            className={controlClass}
            id="planner-name"
            required
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <div className="mt-7 border-t border-rule pt-4">
          <Button
            type="submit"
            variant="primary"
            className="ml-auto flex"
            disabled={!name.trim()}
          >
            변경
          </Button>
        </div>
      </form>
    </Modal>
  );
}
