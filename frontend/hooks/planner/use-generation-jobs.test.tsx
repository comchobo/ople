import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Job, User } from "@/api/core";
import { useGenerationJobs } from "./use-generation-jobs";

const user: User = { id: "a", name: "사용자", email: "a@example.com" };
const json = (value: unknown) => new Response(JSON.stringify(value));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

it("진행 중 생성만 폴링하고 완료 후와 언마운트 시 타이머를 정리한다", async () => {
  vi.useFakeTimers();
  try {
    let status = "running";
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () =>
        json([{ id: "j", status, planner_id: null, error: null }]),
      );
    const onPoll = vi.fn();
    const { result, unmount } = renderHook(() =>
      useGenerationJobs(user, { poll: true, onPoll }),
    );
    await act(async () => {});
    expect(result.current.jobs[0].status).toBe("running");
    status = "completed";
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(result.current.jobs[0].status).toBe("completed");
    expect(onPoll).toHaveBeenCalledTimes(1);
    const completedReads = fetcher.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(fetcher.mock.calls).toHaveLength(completedReads);
    expect(onPoll).toHaveBeenCalledTimes(1);
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

it("실패한 생성 작업을 재시도해 완료 결과를 반환한다", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (path) => {
      if (path === "/api/generations/job/run")
        return json({
          id: "job",
          status: "completed",
          planner_id: "planner-1",
          error: null,
        });
      return json([
        { id: "job", status: "failed", planner_id: null, error: "생성 실패" },
      ]);
    });
  const onPoll = vi.fn();
  const { result } = renderHook(() => useGenerationJobs(user, { onPoll }));
  await waitFor(() => expect(result.current.jobs[0]?.status).toBe("failed"));
  let completed: Job | undefined;
  await act(async () => {
    completed = await result.current.retryGeneration("job");
  });
  expect(completed).toMatchObject({
    status: "completed",
    planner_id: "planner-1",
  });
  expect(fetcher).toHaveBeenCalledWith(
    "/api/generations/job/run",
    expect.objectContaining({ method: "POST" }),
  );
  expect(onPoll).not.toHaveBeenCalled();
});

it("재시도가 실패하면 오류를 노출하고 작업 목록을 다시 조회한다", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (path) => {
      if (path === "/api/generations/job/run")
        return new Response('{"detail":"생성 실패"}', { status: 500 });
      return json([
        { id: "job", status: "failed", planner_id: null, error: "생성 실패" },
      ]);
    });
  const onPoll = vi.fn();
  const { result } = renderHook(() => useGenerationJobs(user, { onPoll }));
  await waitFor(() => expect(result.current.jobs[0]?.status).toBe("failed"));
  await act(async () => {
    await result.current.retryGeneration("job");
  });
  expect(result.current.error).toBe("생성 실패");
  expect(onPoll).toHaveBeenCalledTimes(1);
  expect(
    fetcher.mock.calls.filter(([path]) => path === "/api/generations"),
  ).toHaveLength(2);
});

it("계정 변경 후 이전 계정의 늦은 생성 작업 응답을 반영하지 않는다", async () => {
  const first = deferred<Response>();
  const second = deferred<Response>();
  let reads = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
    return ++reads === 1 ? first.promise : second.promise;
  });
  const { result, rerender } = renderHook(
    ({ account }) => useGenerationJobs(account),
    { initialProps: { account: user } },
  );
  await waitFor(() => expect(reads).toBe(1));
  rerender({ account: { ...user, id: "b" } });
  await waitFor(() => expect(reads).toBe(2));
  await act(async () => {
    second.resolve(
      json([
        { id: "b-job", status: "completed", planner_id: "b", error: null },
      ]),
    );
  });
  expect(result.current.jobs[0].id).toBe("b-job");
  await act(async () => {
    first.resolve(
      json([{ id: "a-job", status: "failed", planner_id: null, error: null }]),
    );
  });
  expect(result.current.jobs.map((job) => job.id)).toEqual(["b-job"]);
  expect(result.current.error).toBe("");
  expect(result.current.loading).toBe(false);
});
