import { expect, it, vi } from "vitest";
import type { Planner } from "./core";
import {
  deletePlanner,
  flushPlannerSaves,
  flushSaves,
  listPlanners,
  savePlanner,
} from "./planners";

const planner: Planner = {
  id: "p",
  name: "처음",
  created_at: "2026-11-19",
  plans: [],
};

it("같은 플래너 저장을 순서대로 실행하고 호출 시점의 값을 보존한다", async () => {
  let finish!: (response: Response) => void;
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue(new Response("{}"));
  const first = savePlanner(planner);
  await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  const edited = { ...planner, name: "최신" };
  const second = savePlanner(edited);
  edited.name = "나중에 변경";
  let flushed = false;
  const flushing = flushSaves().then(() => {
    flushed = true;
  });
  await Promise.resolve();
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(flushed).toBe(false);
  finish(new Response("{}"));
  await Promise.all([first, second, flushing]);
  expect(
    fetcher.mock.calls.map(
      ([, request]) => JSON.parse(String(request?.body)).name,
    ),
  ).toEqual(["처음", "최신"]);
});

it("실패한 저장 뒤의 편집도 저장하고 서로 다른 플래너는 병렬로 처리한다", async () => {
  let fail!: (reason: Error) => void;
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementationOnce(
      () =>
        new Promise<Response>((_, reject) => {
          fail = reject;
        }),
    )
    .mockImplementation(async () => new Response("{}"));
  void savePlanner(planner);
  await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  void savePlanner({ ...planner, name: "재편집" });
  await savePlanner({ ...planner, id: "other" });
  expect(fetcher.mock.calls.map(([path]) => path)).toEqual([
    "/api/planners/p",
    "/api/planners/other",
  ]);
  fail(new Error("offline"));
  await flushSaves();
  expect(fetcher).toHaveBeenLastCalledWith(
    "/api/planners/p",
    expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ name: "재편집", plans: [] }),
    }),
  );
});

it("플래너 목록 조회와 삭제에 올바른 HTTP 메서드를 사용한다", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify([planner])))
    .mockResolvedValueOnce(new Response("{}"));
  expect(await listPlanners()).toEqual([planner]);
  expect(fetcher).toHaveBeenLastCalledWith(
    "/api/planners",
    expect.objectContaining({ method: "GET" }),
  );
  await deletePlanner("p");
  expect(fetcher).toHaveBeenLastCalledWith(
    "/api/planners/p",
    expect.objectContaining({ method: "DELETE" }),
  );
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

it.each(["network", "server"])(
  "%s 저장 실패를 호출자에게 전달하고 완료 후에도 원본별 실패를 기억한다",
  async (failure) => {
    const value = { ...planner, id: `failed-${failure}` };
    const message = failure === "network" ? "offline" : "저장 서버 오류";
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(async () => {
        if (failure === "network") throw new Error(message);
        return new Response(JSON.stringify({ detail: message }), {
          status: 500,
        });
      });
    await expect(savePlanner(value)).rejects.toThrow(message);
    await expect(flushSaves()).resolves.toBeUndefined();
    await expect(flushPlannerSaves(value.id)).rejects.toThrow(message);
    await expect(flushPlannerSaves(value.id)).rejects.toThrow(message);
    expect(fetcher).toHaveBeenCalledTimes(1);

    fetcher.mockResolvedValueOnce(new Response(JSON.stringify(value)));
    await expect(savePlanner(value)).resolves.toEqual(value);
    await expect(flushPlannerSaves(value.id)).resolves.toBeUndefined();
  },
);

it("특정 원본의 저장 확인은 다른 플래너의 대기와 실패에 영향을 받지 않는다", async () => {
  const blocked = deferred<Response>();
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (path) =>
      path === "/api/planners/blocked"
        ? blocked.promise
        : new Response(JSON.stringify(planner)),
    );
  void savePlanner({ ...planner, id: "blocked" });
  void savePlanner({ ...planner, id: "ready" });
  let ready = false;
  const checking = flushPlannerSaves("ready").then(() => {
    ready = true;
  });
  try {
    await vi.waitFor(() => expect(ready).toBe(true));
    expect(fetcher).toHaveBeenCalledTimes(2);
    await checking;
  } finally {
    blocked.reject(new Error("다른 플래너 저장 실패"));
    await flushSaves();
  }
  await expect(flushPlannerSaves("ready")).resolves.toBeUndefined();
  await expect(flushPlannerSaves("never-edited")).resolves.toBeUndefined();
  await expect(flushPlannerSaves("blocked")).rejects.toThrow(
    "다른 플래너 저장 실패",
  );
});

it("원본 저장을 기다리는 동안 추가된 최신 편집까지 확인한다", async () => {
  const first = deferred<Response>();
  const second = deferred<Response>();
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  const value = { ...planner, id: "growing-queue" };
  void savePlanner(value);
  await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  let finished = false;
  const checking = flushPlannerSaves(value.id).then(() => {
    finished = true;
  });
  void savePlanner({ ...value, name: "최신 전체 데이터" });
  try {
    first.resolve(new Response(JSON.stringify(value)));
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    expect(finished).toBe(false);
  } finally {
    second.resolve(
      new Response(JSON.stringify({ ...value, name: "최신 전체 데이터" })),
    );
    await checking;
  }
  expect(finished).toBe(true);
  expect(fetcher).toHaveBeenLastCalledWith(
    "/api/planners/growing-queue",
    expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ name: "최신 전체 데이터", plans: [] }),
    }),
  );
});

it("이전 저장이 실패해도 최신 전체 데이터 저장이 성공하면 원본 저장 확인이 성공한다", async () => {
  const first = deferred<Response>();
  const value = { ...planner, id: "recovered-queue" };
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockReturnValueOnce(first.promise)
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ ...value, name: "최신" })),
    );
  void savePlanner(value);
  await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  const checking = flushPlannerSaves(value.id);
  void savePlanner({ ...value, name: "최신" });
  first.reject(new Error("이전 요청 실패"));
  await expect(checking).resolves.toBeUndefined();
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it("이전 저장이 성공해도 최신 저장이 실패하면 원본 저장 확인이 실패한다", async () => {
  const value = { ...planner, id: "latest-failure" };
  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify(value)))
    .mockRejectedValueOnce(new Error("최신 저장 실패"));
  void savePlanner(value);
  void savePlanner({ ...value, name: "최신" });
  await expect(flushPlannerSaves(value.id)).rejects.toThrow("최신 저장 실패");
  await expect(flushSaves()).resolves.toBeUndefined();
});
