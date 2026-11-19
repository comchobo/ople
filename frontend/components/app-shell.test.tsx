import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { setInterviewActive } from "@/hooks/use-app-navigation";
import { AuthProvider } from "@/hooks/use-auth";
import { AppShell } from "./app-shell";

const routing = vi.hoisted(() => ({
  path: "/",
  push: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => routing.path,
  useRouter: () => routing,
}));

const account = { id: "u", name: "사용자", email: "hello@example.com" };
const json = (value: unknown) => new Response(JSON.stringify(value));

beforeEach(() => {
  routing.path = "/";
  window.history.replaceState(null, "", "/");
});
afterEach(() => setInterviewActive(false));

function renderShell() {
  return render(
    <AuthProvider>
      <AppShell>
        <main>페이지 내용</main>
      </AppShell>
    </AuthProvider>,
  );
}

it.each([
  ["/", "intro"],
  ["/planners/new", "interview"],
  ["/planners", "planners"],
  ["/planners/p", "board"],
])("%s 경로의 레이아웃과 자식 화면을 유지한다", async (path, view) => {
  routing.path = path;
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json(account));
  renderShell();
  await screen.findByRole("button", { name: "계정" });
  expect(screen.getByRole("main").parentElement).toHaveClass(view);
});

it.each(["/privacy", "/terms"])(
  "%s에서는 자식 화면만 표시한다",
  async (path) => {
    routing.path = path;
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(json(account));
    renderShell();
    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    expect(screen.getByRole("main")).toHaveTextContent("페이지 내용");
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  },
);

it("인증 확인 중 로그인을 막고 이벤트로 연 로그인 결과를 계정 메뉴에 반영한다", async () => {
  let finishCheck: (response: Response) => void = () => {};
  const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation((path) => {
    if (path === "/api/auth/me")
      return new Promise((resolve) => {
        finishCheck = resolve;
      });
    return Promise.resolve(json(account));
  });
  const user = userEvent.setup();
  renderShell();
  expect(screen.getByRole("button", { name: "로그인" })).toBeDisabled();
  await act(async () => {
    finishCheck(new Response("{}", { status: 401 }));
  });
  expect(screen.getByRole("button", { name: "로그인" })).toBeEnabled();
  act(() => window.dispatchEvent(new Event("ople:login")));
  const dialog = within(screen.getByRole("dialog", { name: "로그인" }));
  await user.type(dialog.getByLabelText("이메일"), account.email);
  await user.type(dialog.getByLabelText("비밀번호"), "password123");
  await user.click(dialog.getByRole("button", { name: "로그인" }));
  await waitFor(() => expect(routing.replace).toHaveBeenCalledWith("/"));
  expect(fetcher).toHaveBeenCalledWith(
    "/api/auth/login",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ email: account.email, password: "password123" }),
    }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "계정" }));
  expect(screen.getByText(account.email)).toBeVisible();
});

it("헤더에서 로그인 창을 열고 닫는다", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response("{}", { status: 401 }),
  );
  const user = userEvent.setup();
  renderShell();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "로그인" })).toBeEnabled(),
  );
  await user.click(screen.getByRole("button", { name: "로그인" }));
  await user.click(screen.getByRole("button", { name: "닫기" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("계정에서 인터뷰 이탈을 취소하면 모달을 유지하고 이동하면 닫는다", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json(account));
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const user = userEvent.setup();
  renderShell();
  await user.click(await screen.findByRole("button", { name: "계정" }));
  setInterviewActive(true);
  const dialog = screen.getByRole("dialog", { name: "내 계정" });
  await user.click(within(dialog).getByRole("button", { name: "내 플래너" }));
  expect(routing.push).not.toHaveBeenCalled();
  expect(dialog).toBeVisible();
  confirm.mockReturnValue(true);
  await user.click(within(dialog).getByRole("button", { name: "내 플래너" }));
  await waitFor(() => expect(routing.push).toHaveBeenCalledWith("/planners"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("로그아웃 취소 시 API를 호출하지 않고 승인하면 한 번 확인 후 홈으로 이동한다", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => json(account));
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const user = userEvent.setup();
  renderShell();
  await user.click(await screen.findByRole("button", { name: "계정" }));
  setInterviewActive(true);
  await user.click(screen.getByRole("button", { name: "로그아웃" }));
  expect(fetcher.mock.calls.map(([path]) => path)).toEqual(["/api/auth/me"]);
  expect(screen.getByRole("dialog", { name: "내 계정" })).toBeVisible();
  confirm.mockReturnValue(true);
  await user.click(screen.getByRole("button", { name: "로그아웃" }));
  await waitFor(() => expect(routing.replace).toHaveBeenCalledWith("/"));
  expect(confirm).toHaveBeenCalledTimes(2);
  expect(fetcher).toHaveBeenCalledWith(
    "/api/auth/logout",
    expect.objectContaining({ method: "POST" }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "로그인" })).toBeEnabled();
});

it("로그아웃 실패 시 오류와 계정 모달을 유지하며 이동하지 않는다", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (path) =>
    path === "/api/auth/me"
      ? json(account)
      : new Response(JSON.stringify({ detail: "로그아웃 실패" }), {
          status: 500,
        }),
  );
  const user = userEvent.setup();
  renderShell();
  await user.click(await screen.findByRole("button", { name: "계정" }));
  await user.click(screen.getByRole("button", { name: "로그아웃" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("로그아웃 실패");
  expect(screen.getByRole("dialog", { name: "내 계정" })).toBeVisible();
  expect(routing.replace).not.toHaveBeenCalled();
});
