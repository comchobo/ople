"use client";

import { useEffect, useRef, useState } from "react";
import type { Planner, User } from "@/api/core";
import {
  copyPlanner,
  isPlannerCopyNameError,
  PlannerCopyError,
  type PlannerCopyInput,
} from "@/api/planner-copies";
import { flushPlannerSaves } from "@/api/planners";

type CopyRequest = {
  userId: string;
  sourceId: string;
  key: string;
  input: PlannerCopyInput;
};

type FailureStage = "saving" | "copying";

type CopyState = {
  status: "idle" | "saving" | "copying" | "failed" | "succeeded";
  sourceId: string | null;
  result: Planner | null;
  error: Error | null;
  failureStage: FailureStage | null;
};

const initialState: CopyState = {
  status: "idle",
  sourceId: null,
  result: null,
  error: null,
  failureStage: null,
};

function allowsRetry(error: Error | null): boolean {
  return (
    error !== null &&
    (!(error instanceof PlannerCopyError) ||
      error.status >= 500 ||
      error.status === 408 ||
      error.status === 429)
  );
}

export function usePlannerCopy(user: User | null) {
  const userId = user?.id ?? null;
  const [state, setState] = useState<CopyState>(initialState);
  const operation = useRef<CopyRequest | null>(null);
  const failure = useRef<{ error: Error; stage: FailureStage } | null>(null);
  const active = useRef(false);
  const busy = useRef(false);
  const version = useRef(0);
  const account = useRef(userId);
  account.current = userId;

  useEffect(() => {
    version.current += 1;
    active.current = true;
    account.current = userId;
    operation.current = null;
    failure.current = null;
    busy.current = false;
    setState(initialState);
    return () => {
      active.current = false;
      version.current += 1;
    };
  }, [userId]);

  async function run(request: CopyRequest): Promise<Planner | undefined> {
    if (!active.current || busy.current || request.userId !== account.current)
      return;
    busy.current = true;
    failure.current = null;
    const started = version.current;
    let stage: FailureStage = "saving";
    const current = () =>
      version.current === started && account.current === request.userId;
    setState({
      status: "saving",
      sourceId: request.sourceId,
      result: null,
      error: null,
      failureStage: null,
    });
    try {
      await flushPlannerSaves(request.sourceId);
      if (!current()) return;
      stage = "copying";
      setState({
        status: "copying",
        sourceId: request.sourceId,
        result: null,
        error: null,
        failureStage: null,
      });
      const result = await copyPlanner(
        request.sourceId,
        request.key,
        request.input,
      );
      if (!current()) return;
      operation.current = null;
      setState({
        status: "succeeded",
        sourceId: request.sourceId,
        result,
        error: null,
        failureStage: null,
      });
      return result;
    } catch (cause) {
      if (!current()) return;
      const error =
        cause instanceof Error
          ? cause
          : new Error("플래너를 복제하지 못했습니다.");
      failure.current = { error, stage };
      setState({
        status: "failed",
        sourceId: request.sourceId,
        result: null,
        error,
        failureStage: stage,
      });
    } finally {
      if (current()) busy.current = false;
    }
  }

  async function start(sourceId: string, input: PlannerCopyInput = {}) {
    if (
      !active.current ||
      busy.current ||
      userId === null ||
      account.current !== userId
    )
      return;
    const request: CopyRequest = {
      userId,
      sourceId,
      key: crypto.randomUUID(),
      input: input.name === undefined ? {} : { name: input.name },
    };
    operation.current = request;
    return run(request);
  }

  async function retry() {
    if (
      !active.current ||
      userId === null ||
      account.current !== userId ||
      !operation.current ||
      !failure.current
    )
      return;
    if (
      failure.current.stage !== "saving" &&
      !allowsRetry(failure.current.error)
    )
      return;
    return run(operation.current);
  }

  async function submitName(name: string) {
    if (
      !active.current ||
      busy.current ||
      userId === null ||
      account.current !== userId ||
      !operation.current ||
      failure.current?.stage !== "copying" ||
      !isPlannerCopyNameError(failure.current.error)
    )
      return;
    const request = { ...operation.current, input: { name } };
    operation.current = request;
    return run(request);
  }

  function cancelNameInput() {
    if (
      !active.current ||
      account.current !== userId ||
      busy.current ||
      failure.current?.stage !== "copying" ||
      !isPlannerCopyNameError(failure.current.error)
    )
      return;
    operation.current = null;
    failure.current = null;
    setState(initialState);
  }

  return {
    ...state,
    pending: state.status === "saving" || state.status === "copying",
    canRetry:
      state.status === "failed" &&
      (state.failureStage === "saving" || allowsRetry(state.error)),
    needsName:
      state.status === "failed" &&
      state.failureStage === "copying" &&
      isPlannerCopyNameError(state.error),
    start,
    retry,
    submitName,
    cancelNameInput,
  };
}
