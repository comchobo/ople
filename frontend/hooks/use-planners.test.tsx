import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Planner, User } from "@/api/core";
import { usePlanners } from "./use-planners";

const user: User = { id: "a", name: "사용자", email: "a@example.com" };
const planner: Planner = {
  id: "p",
  name: "기존 계획",
  created_at: "2026-11-17T00:00:00Z",
  plans: [],
};
const json = (value: unknown) => new Response(JSON.stringify(value));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

it("계정 변경 후 이전 계정의 늦은 응답과 오류를 반영하지 않는다", async () => {
  const first = deferred<Response>();
  const second = deferred<Response>();
  let reads = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation(async (path) => {
    if (path === "/api/generations") return json([]);
    return ++reads === 1 ? first.promise : second.promise;
  });
  const { result, rerender } = renderHook(
    ({ account }) => usePlanners(account),
    { initialProps: { account: user } },
  );
  await waitFor(() => expect(reads).toBe(1));
  rerender({ account: { ...user, id: "b" } });
  await waitFor(() => expect(reads).toBe(2));
  await act(async () => {
    second.resolve(json([{ ...planner, id: "b-plan" }]));
  });
  expect(result.current.planners[0].id).toBe("b-plan");
  await act(async () => {
    first.resolve(new Response('{"detail":"이전 계정 오류"}', { status: 500 }));
  });
  expect(result.current.planners.map((item) => item.id)).toEqual(["b-plan"]);
  expect(result.current.error).toBe("");
  expect(result.current.loading).toBe(false);
});

it("갱신 요청 이후의 로컬 편집을 보존하고 API에 저장한다", async () => {
  const stale = deferred<Response>();
  let reads = 0;
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (path, options) => {
      if (path === "/api/generations") return json([]);
      if (options?.method === "PUT") return json(planner);
      return ++reads === 1 ? json([planner]) : stale.promise;
    });
  const { result } = renderHook(() => usePlanners(user));
  await waitFor(() => expect(result.current.loading).toBe(false));
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.refresh();
  });
  await waitFor(() => expect(reads).toBe(2));
  act(() => {
    result.current.change({ ...planner, name: "최신 이름" });
  });
  await act(async () => {
    stale.resolve(json([planner]));
    await pending;
  });
  expect(result.current.planners[0].name).toBe("최신 이름");
  expect(fetcher).toHaveBeenCalledWith(
    "/api/planners/p",
    expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ name: "최신 이름", plans: [] }),
    }),
  );
});

it("진행 중 생성만 폴링하고 완료 후와 언마운트 시 타이머를 정리한다", async () => {
  vi.useFakeTimers();
  try {
    let status = "running";
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (path) =>
        json(
          path === "/api/generations"
            ? [{ id: "j", status, planner_id: null, error: null }]
            : [planner],
        ),
      );
    const { result, unmount } = renderHook(() => usePlanners(user, true));
    await act(async () => {});
    expect(result.current.jobs[0].status).toBe("running");
    status = "completed";
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(result.current.jobs[0].status).toBe("completed");
    const completedReads = fetcher.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(fetcher.mock.calls).toHaveLength(completedReads);
    status = "running";
    await act(async () => {
      await result.current.refresh();
    });
    unmount();
    const unmountedReads = fetcher.mock.calls.length;
    await vi.advanceTimersByTimeAsync(3000);
    expect(fetcher.mock.calls).toHaveLength(unmountedReads);
  } finally {
    vi.useRealTimers();
  }
});
