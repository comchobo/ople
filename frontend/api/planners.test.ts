import { expect, it, vi } from "vitest";
import type { Planner } from "./core";
import {
  deletePlanner,
  flushSaves,
  listPlanners,
  savePlanner,
} from "./planners";

const planner: Planner = {
  id: "p",
  name: "처음",
  created_at: "2026-11-19",
  is_favorite: false,
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
