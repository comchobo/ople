import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import type { Planner } from "@/lib/api";
import { Ople } from "./ople";

function sample(): Planner {
  return {
    id: "p",
    name: "나의 계획",
    created_at: "2026-11-17T00:00:00Z",
    plans: [
      "현재 방향을 발전시키는 계획",
      "다른 방향을 탐색하는 계획",
      "원하는 삶에서 출발하는 계획",
    ].map((kind) => ({
      kind,
      title: "이전 제목",
      description: "설명",
      scores: {},
      pieces: [],
    })),
  };
}
const json = (value: unknown) => new Response(JSON.stringify(value));

it("이전 저장 완료 후 목록을 갱신해 이름 변경이 최신 편집을 보존한다", async () => {
  let stored = sample();
  let completeSave: (() => void) | undefined;
  const writes: Planner[] = [];
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (path, options) => {
      if (path === "/api/auth/me")
        return json({ id: "u", email: "hello@example.com", name: "사용자" });
      if (path === "/api/generations") return json([]);
      if (options?.method === "PUT") {
        const body = JSON.parse(String(options.body));
        writes.push(body);
        if (writes.length === 1)
          await new Promise<void>((resolve) => {
            completeSave = resolve;
          });
        stored = { ...stored, ...body };
        return json(stored);
      }
      return json([structuredClone(stored)]);
    });
  const user = userEvent.setup();
  render(<Ople />);
  await user.click(await screen.findByRole("button", { name: "나의 계획" }));
  await user.click(screen.getByRole("button", { name: "플랜 수정" }));
  await user.clear(screen.getByLabelText("제목"));
  await user.type(screen.getByLabelText("제목"), "중요한 수정");
  await user.click(screen.getByRole("button", { name: "저장" }));
  await waitFor(() => expect(completeSave).toBeDefined());
  const readsBefore = fetcher.mock.calls.filter(
    ([path]) => path === "/api/planners",
  ).length;
  await user.click(screen.getAllByRole("button", { name: "내 플래너" })[0]);
  expect(
    fetcher.mock.calls.filter(([path]) => path === "/api/planners"),
  ).toHaveLength(readsBefore);
  await act(async () => {
    completeSave?.();
  });
  await waitFor(() =>
    expect(
      fetcher.mock.calls.filter(([path]) => path === "/api/planners").length,
    ).toBeGreaterThan(readsBefore),
  );
  await user.click(screen.getByRole("button", { name: "이름 변경" }));
  await user.clear(screen.getByLabelText("이름"));
  await user.type(screen.getByLabelText("이름"), "새 이름");
  await user.click(screen.getByRole("button", { name: "변경" }));
  await waitFor(() => expect(writes).toHaveLength(2));
  expect(writes[1].plans[0].title).toBe("중요한 수정");
  expect(
    screen.queryByText(/저장 중|저장됨|저장 실패/),
  ).not.toBeInTheDocument();
});

it("실패한 생성 작업을 같은 작업 ID로 재시도하고 완성된 플래너를 연다", async () => {
  let complete = false;
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (path) => {
      if (path === "/api/auth/me")
        return json({ id: "u", email: "hello@example.com", name: "사용자" });
      if (path === "/api/planners") return json(complete ? [sample()] : []);
      if (path === "/api/generations/job/run") {
        complete = true;
        return json({
          id: "job",
          status: "completed",
          planner_id: "p",
          error: null,
        });
      }
      return json([
        {
          id: "job",
          status: complete ? "completed" : "failed",
          planner_id: complete ? "p" : null,
          error: "생성 실패",
        },
      ]);
    });
  const user = userEvent.setup();
  render(<Ople />);
  await user.click(await screen.findByRole("button", { name: "다시 시도" }));
  expect(
    await screen.findByRole("heading", { name: "나의 계획" }),
  ).toBeVisible();
  expect(fetcher).toHaveBeenCalledWith(
    "/api/generations/job/run",
    expect.objectContaining({ method: "POST" }),
  );
});
