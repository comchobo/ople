import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Planner, User } from "@/api/core";
import { usePlanners } from "./use-planners";

const user: User = { id: "a", name: "사용자", email: "a@example.com" };
const planner: Planner = {
  id: "p",
  name: "기존 계획",
  created_at: "2026-11-17T00:00:00Z",
  is_favorite: false,
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
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
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
    .mockImplementation(async (_path, options) => {
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

it("생성 작업 API가 아닌 플래너 API만 조회한다", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(json([planner]));
  const { result } = renderHook(() => usePlanners(user));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(fetcher.mock.calls.map(([path]) => path)).toEqual(["/api/planners"]);
});

it("뒤늦은 목록 응답과 이전 이름 편집본이 저장된 별을 되돌리지 않는다", async () => {
  const stale = deferred<Response>();
  const favorite = deferred<Response>();
  let reads = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation(async (path, options) => {
    if (path === "/api/planners/p/favorite") return favorite.promise;
    if (options?.method === "PUT") return json(planner);
    return ++reads === 1 ? json([planner]) : stale.promise;
  });
  const { result } = renderHook(() => usePlanners(user));
  await waitFor(() => expect(result.current.loading).toBe(false));
  let refresh!: Promise<void>;
  let save!: Promise<void>;
  act(() => {
    refresh = result.current.refresh();
    save = result.current.setFavorite(planner.id, true);
    result.current.change({ ...planner, name: "저장 중 변경" });
  });
  await waitFor(() => expect(reads).toBe(2));
  await act(async () => {
    favorite.resolve(json({ is_favorite: true }));
    await save;
  });
  expect(result.current.planners[0]).toMatchObject({
    name: "저장 중 변경",
    is_favorite: true,
  });
  await act(async () => {
    stale.resolve(json([{ ...planner, name: "저장 중 변경" }]));
    await refresh;
    result.current.change({ ...planner, name: "다음 이름" });
  });
  expect(result.current.planners[0]).toMatchObject({
    name: "다음 이름",
    is_favorite: true,
  });
});
