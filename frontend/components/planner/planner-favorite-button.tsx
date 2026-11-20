"use client";

import { useState } from "react";
import type { Planner } from "@/api/core";

export function PlannerFavoriteButton({
  planner,
  save,
}: {
  planner: Planner;
  save: (id: string, value: boolean) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function toggle() {
    setPending(true);
    setError("");
    try {
      await save(planner.id, !planner.is_favorite);
    } catch {
      setError("즐겨찾기를 저장하지 못했어요. 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="flex shrink-0 flex-col items-start">
      <button
        type="button"
        aria-label={`${planner.name} 즐겨찾기`}
        aria-pressed={planner.is_favorite}
        disabled={pending}
        onClick={toggle}
        className="min-h-11 min-w-11 cursor-pointer rounded-[3px] text-2xl hover:bg-[#f3f3f3] focus-visible:outline-2 disabled:cursor-wait disabled:opacity-50"
      >
        <span aria-hidden="true">{planner.is_favorite ? "★" : "☆"}</span>
      </button>
      {pending && (
        <span role="status" className="text-xs text-[#666]">
          저장 중…
        </span>
      )}
      {error && (
        <span role="alert" className="max-w-24 text-xs">
          {error}
        </span>
      )}
    </div>
  );
}
