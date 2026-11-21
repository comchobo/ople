import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import type { Planner } from "@/api/core";
import { HomeScreen } from "@/components/home/home-screen";
import { InterviewScreen } from "@/components/interview/interview-screen";
import { SiteHeader } from "@/components/navigation/site-header";
import { AuthProvider } from "@/hooks/auth/use-auth";
import { PlannerBoardScreen } from "./planner-board-screen";
import { PlannersScreen } from "./planners-screen";

const routing = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => routing,
}));

function Application({ initialPath = "/planners" }: { initialPath?: string }) {
  const [path, setPath] = useState(initialPath);
  routing.push.mockImplementation(setPath);
  routing.replace.mockImplementation(setPath);
  return (
    <AuthProvider>
      <div id="app">
        <SiteHeader />
        {path === "/planners" ? (
          <PlannersScreen />
        ) : path === "/" ? (
          <HomeScreen />
        ) : path === "/planners/new" ? (
          <InterviewScreen />
        ) : (
          <PlannerBoardScreen key={path} plannerId={path.split("/")[2]} />
        )}
      </div>
    </AuthProvider>
  );
}

function sample(): Planner {
  return {
    id: "p",
    name: "나의 계획",
    created_at: "2026-11-17T00:00:00Z",
    is_favorite: false,
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
  render(<Application />);
  await user.click(await screen.findByRole("button", { name: "나의 계획" }));
  await user.click(await screen.findByRole("button", { name: "플랜 수정" }));
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

it("비로그인 사용자는 홈으로 이동하고 로그인 창을 연다", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response("{}", { status: 401 }));
  render(<Application />);
  expect(await screen.findByRole("dialog", { name: "로그인" })).toBeVisible();
  expect(
    await screen.findByRole("heading", { name: /하나의 정답 대신/ }),
  ).toBeVisible();
  expect(fetcher.mock.calls.map(([path]) => path)).toEqual(["/api/auth/me"]);
});

it("홈에서 시작하면 인증된 사용자는 플래너 목록으로 이동한다", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (path) =>
    json(
      path === "/api/auth/me"
        ? { id: "u", email: "hello@example.com", name: "사용자" }
        : [],
    ),
  );
  const user = userEvent.setup();
  render(<Application initialPath="/" />);
  await user.click(
    await screen.findByRole("button", { name: "나의 플래너 시작하기" }),
  );
  expect(
    await screen.findByRole("heading", { name: "내 플래너" }),
  ).toBeVisible();
});

it("새 인터뷰 화면은 목록 조회 없이 준비 화면을 표시한다", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(
      json({ id: "u", email: "hello@example.com", name: "사용자" }),
    );
  render(<Application initialPath="/planners/new" />);
  expect(
    await screen.findByRole("button", { name: "인터뷰 시작" }),
  ).toBeEnabled();
  expect(fetcher.mock.calls.map(([path]) => path)).toEqual(["/api/auth/me"]);
});

it("존재하지 않는 플래너는 목록으로 돌려보낸다", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (path) =>
    json(
      path === "/api/auth/me"
        ? { id: "u", email: "hello@example.com", name: "사용자" }
        : [],
    ),
  );
  render(<Application initialPath="/planners/missing" />);
  expect(
    await screen.findByRole("heading", { name: "내 플래너" }),
  ).toBeVisible();
  expect(screen.getByText("아직 플래너가 없어요")).toBeVisible();
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
  render(<Application />);
  await user.click(await screen.findByRole("button", { name: "다시 시도" }));
  expect(
    await screen.findByRole("heading", { name: "나의 계획" }),
  ).toBeVisible();
  expect(fetcher).toHaveBeenCalledWith(
    "/api/generations/job/run",
    expect.objectContaining({ method: "POST" }),
  );
});

it("별 버튼은 저장 확인을 기다리고 실패한 요청을 다시 시도한다", async () => {
  let finish!: (response: Response) => void;
  const writes: unknown[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (path, options) => {
    if (path === "/api/auth/me") return json({ id: "u", name: "사용자" });
    if (path === "/api/generations") return json([]);
    if (path === "/api/planners")
      return json([{ ...sample(), is_favorite: false }]);
    if (path === "/api/planners/p/favorite" && options?.method === "PUT") {
      writes.push(JSON.parse(String(options.body)));
      return new Promise<Response>((resolve) => {
        finish = resolve;
      });
    }
    throw Error(String(path));
  });
  const user = userEvent.setup();
  render(<Application />);
  const button = await screen.findByRole("button", {
    name: "나의 계획 즐겨찾기",
    pressed: false,
  });
  button.focus();
  await user.keyboard("{Enter}");
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-pressed", "false");
  await user.click(button);
  expect(writes).toEqual([{ is_favorite: true }]);
  await act(async () => finish(new Response("{}", { status: 500 })));
  expect(await screen.findByRole("alert")).toBeVisible();
  expect(button).toBeEnabled();
  await user.click(button);
  await act(async () => finish(json({ is_favorite: true })));
  expect(button).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByRole("alert")).toBeNull();
  await user.click(button);
  await act(async () => finish(json({ is_favorite: false })));
  expect(button).toHaveAttribute("aria-pressed", "false");
  expect(writes.at(-1)).toEqual({ is_favorite: false });
});
