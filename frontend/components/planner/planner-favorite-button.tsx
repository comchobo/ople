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
  const [target, setTarget] = useState<boolean | null>(null);
  const favorite = target ?? planner.is_favorite;
  const [rejection, setRejection] = useState(0);
  useEffect(() => {
    if (!rejection) return;
    const timer = window.setTimeout(() => setRejection(0), 4000);
    return () => window.clearTimeout(timer);
  }, [rejection]);

  async function persist(value: boolean, retry: boolean) {
    setPending(true);
    setTarget(value);
    try {
      try {
        await save(planner.id, value);
      } catch (cause) {
        if (retry) {
          setRejection(0);
          return;
        }
        if (cause instanceof Error && cause.message === "favorite_not_saved") {
          setTarget(null);
          setRejection((count) => count + 1);
          return;
        }
        await save(planner.id, value);
      }
      setTarget(null);
      setRejection(0);
    } catch {
      // An earlier attempt may already have committed. Keep its target for retry.
      setRejection(0);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="flex shrink-0 flex-col items-start">
      <button
        type="button"
        aria-label={`${planner.name} 즐겨찾기`}
        aria-pressed={favorite}
        disabled={pending || target !== null}
        onClick={() => persist(!favorite, false)}
        className="min-h-11 min-w-11 cursor-pointer rounded-[3px] text-2xl hover:bg-[#f3f3f3] focus-visible:outline-2 disabled:cursor-wait disabled:opacity-50"
      >
        <span aria-hidden="true">{favorite ? "★" : "☆"}</span>
      </button>
      {rejection > 0 && (
        <span
          role="alert"
          className="fixed bottom-6 left-1/2 z-50 w-max max-w-[90vw] -translate-x-1/2 rounded bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          즐겨찾기를 저장하지 못했어요.
        </span>
      )}
      {!pending && target !== null && (
        <span role="alert" className="max-w-24 text-xs">
          즐겨찾기 저장 여부를 확인할 수 없어요.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => persist(target, true)}
          >
            다시 시도
          </button>
        </span>
      )}
    </div>
  );
}
