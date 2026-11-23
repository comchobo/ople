"use client";

import { useEffect, useState } from "react";
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
  const [rejection, setRejection] = useState(0);
  useEffect(() => {
    if (!rejection) return;
    const timer = window.setTimeout(() => setRejection(0), 4000);
    return () => window.clearTimeout(timer);
  }, [rejection]);

  async function toggle() {
    setPending(true);
    setError("");
    try {
      await save(planner.id, !planner.is_favorite);
      setRejection(0);
    } catch (cause) {
      if (cause instanceof Error && cause.message === "favorite_not_saved") {
        setRejection((count) => count + 1);
        return;
      }
      setRejection(0);
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
      {rejection > 0 && (
        <span
          role="alert"
          className="fixed bottom-6 left-1/2 z-50 w-max max-w-[90vw] -translate-x-1/2 rounded bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          즐겨찾기 변경이 저장되지 않았어요
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
