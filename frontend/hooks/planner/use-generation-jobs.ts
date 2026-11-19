"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Job, User } from "@/api/core";
import { listGenerations, runGeneration } from "@/api/generations";

export function useGenerationJobs(
  user: User | null,
  {
    poll = false,
    onPoll,
  }: { poll?: boolean; onPoll?: () => void | Promise<void> } = {},
) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const account = version.current;
    const values = await listGenerations();
    if (account !== version.current) return;
    setJobs(values);
  }, []);
  useEffect(() => {
    const account = ++version.current;
    setJobs([]);
    setError("");
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
  useEffect(() => {
    if (!poll || !user || !jobs.some((job) => job.status === "running")) return;
    const timer = setInterval(() => {
      void refresh().catch(() => {});
      void Promise.resolve(onPoll?.()).catch(() => {});
    }, 3000);
    return () => clearInterval(timer);
  }, [poll, user, jobs, refresh, onPoll]);
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
      if (result.status !== "completed" || !result.planner_id) {
        await Promise.all([refresh(), onPoll?.()]);
      }
      return result;
    } catch (cause) {
      if (account !== version.current) return;
      setError((cause as Error).message);
      await refresh().catch(() => {});
      await Promise.resolve(onPoll?.()).catch(() => {});
    }
  }
  return {
    jobs,
    loading,
    error,
    setError,
    refresh,
    retryGeneration,
  };
}
