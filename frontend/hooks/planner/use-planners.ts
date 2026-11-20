"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Job, Planner, User } from "@/api/core";
import { listGenerations, runGeneration } from "@/api/generations";
import {
  deletePlanner,
  flushSaves,
  listPlanners,
  savePlanner,
} from "@/api/planners";

export function usePlanners(user: User | null, poll = false) {
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const version = useRef(0);
  const activeUser = useRef(user?.id ?? null);
  activeUser.current = user?.id ?? null;
  const localCopies = useRef(new Map<string, number>());
  const revision = useRef(0);
  const localEdits = useRef(new Map<string, number>());
  const refresh = useCallback(async () => {
    const account = version.current;
    await flushSaves();
    const started = revision.current;
    const [values, tasks] = await Promise.all([
      listPlanners(),
      listGenerations(),
    ]);
    if (account !== version.current) return;
    setPlanners((current) => {
      const received = new Set(values.map((value) => value.id));
      const newerCopies = current.filter(
        (value) =>
          !received.has(value.id) &&
          (localCopies.current.get(value.id) ?? 0) > started,
      );
      return [
        ...newerCopies,
        ...values.map((value) =>
          (localEdits.current.get(value.id) ?? 0) > started
            ? (current.find((item) => item.id === value.id) ?? value)
            : value,
        ),
      ];
    });
    setJobs(tasks);
  }, []);
  useEffect(() => {
    const account = ++version.current;
    activeUser.current = user?.id ?? null;
    setPlanners([]);
    setJobs([]);
    setError("");
    localEdits.current.clear();
    localCopies.current.clear();
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
      activeUser.current = null;
      version.current += 1;
    };
  }, [user, refresh]);
  useEffect(() => {
    if (!poll || !user || !jobs.some((job) => job.status === "running")) return;
    const timer = setInterval(() => {
      void refresh().catch(() => {});
    }, 3000);
    return () => clearInterval(timer);
  }, [poll, user, jobs, refresh]);
  function change(value: Planner) {
    localEdits.current.set(value.id, ++revision.current);
    setPlanners((current) =>
      current.map((item) => (item.id === value.id ? value : item)),
    );
    void savePlanner(value);
  }
  function includeCopy(value: Planner) {
    if (!user || user.id !== activeUser.current) return false;
    localCopies.current.set(value.id, ++revision.current);
    setPlanners((current) => [
      value,
      ...current.filter((item) => item.id !== value.id),
    ]);
    return true;
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
  async function retryGeneration(id: string) {
    const account = version.current;
    setJobs((current) =>
      current.map((job) =>
        job.id === id ? { ...job, status: "running" } : job,
      ),
    );
    try {
      const result = await runGeneration(id);
      if (account !== version.current) return;
      if (result.status !== "completed" || !result.planner_id) await refresh();
      return result;
    } catch (cause) {
      if (account !== version.current) return;
      setError((cause as Error).message);
      await refresh().catch(() => {});
    }
  }
  return {
    planners,
    jobs,
    loading,
    error,
    setError,
    refresh,
    retryGeneration,
    change,
    remove,
    includeCopy,
  };
}
