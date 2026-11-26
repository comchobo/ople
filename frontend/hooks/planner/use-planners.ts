"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Planner, User } from "@/api/core";
import {
  deletePlanner,
  flushSaves,
  listPlanners,
  saveFavorite,
  savePlanner,
} from "@/api/planners";

export function usePlanners(user: User | null) {
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const version = useRef(0);
  const revision = useRef(0);
  const localEdits = useRef(new Map<string, number>());
  const favoriteEdits = useRef(new Map<string, number>());
  const refresh = useCallback(async () => {
    const account = version.current;
    await flushSaves();
    const started = revision.current;
    const values = await listPlanners();
    if (account !== version.current) return;
    setPlanners((current) =>
      values.map((value) => {
        const previous = current.find((item) => item.id === value.id);
        if (!previous) return value;
        const edited = (localEdits.current.get(value.id) ?? 0) > started;
        const starred = (favoriteEdits.current.get(value.id) ?? 0) > started;
        return {
          ...value,
          ...(edited && { name: previous.name, plans: previous.plans }),
          is_favorite: starred ? previous.is_favorite : value.is_favorite,
        };
      }),
    );
  }, []);
  useEffect(() => {
    const account = ++version.current;
    setPlanners([]);
    setError("");
    localEdits.current.clear();
    favoriteEdits.current.clear();
    setLoading(true);
    if (user) {
      void refresh()
        .catch((cause: Error) => {
          if (account === version.current) setError(cause.message);
        })
        .finally(() => {
          if (account === version.current) setLoading(false);
        });
    }
    return () => {
      version.current += 1;
    };
  }, [user, refresh]);
  function change(value: Planner) {
    localEdits.current.set(value.id, ++revision.current);
    setPlanners((current) =>
      current.map((item) =>
        item.id === value.id
          ? { ...item, name: value.name, plans: value.plans }
          : item,
      ),
    );
    void savePlanner(value);
  }
  async function setFavorite(id: string, isFavorite: boolean) {
    const account = version.current;
    const saved = await saveFavorite(id, isFavorite);
    if (account !== version.current) return;
    favoriteEdits.current.set(id, ++revision.current);
    setPlanners((current) =>
      current.map((item) =>
        item.id === id ? { ...item, is_favorite: saved.is_favorite } : item,
      ),
    );
  }
  async function remove(id: string) {
    const account = version.current;
    try {
      await deletePlanner(id);
      if (account === version.current)
        setPlanners((current) => current.filter((item) => item.id !== id));
    } catch (cause) {
      if (account === version.current) setError((cause as Error).message);
    }
  }
  return {
    planners,
    loading,
    error,
    setError,
    refresh,
    change,
    setFavorite,
    remove,
  };
}
