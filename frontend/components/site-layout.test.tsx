import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { AuthProvider } from "@/hooks/use-auth";
import { SiteLayout } from "./site-layout";

const routing = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  path: "/",
}));
vi.mock("next/navigation", () => ({
  useRouter: () => routing,
  usePathname: () => routing.path,
}));
const user = { id: "u", name: "사용자", email: "hello@example.com" };
const json = (value: unknown) => new Response(JSON.stringify(value));

function application() {
  return render(
    <AuthProvider>
      <SiteLayout>
        <main>페이지 내용</main>
      </SiteLayout>
    </AuthProvider>,
  );
}

afterEach(() => {
  routing.path = "/";
  vi.clearAllMocks();
});

it.each([
  ["/", "intro"],
  ["/planners", "planners"],
  ["/planners/new", "interview"],
  ["/planners/p", "board"],
])("%s에서 페이지 스타일과 공통 헤더를 유지한다", async (path, view) => {
  routing.path = path;
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json(user));
  const { container } = application();

  expect(container.querySelector("#app")).toHaveClass(view);
  expect(screen.getByRole("main")).toHaveTextContent("페이지 내용");
  expect(await screen.findByRole("button", { name: "계정" })).toBeVisible();
  const interaction = userEvent.setup();
  await interaction.click(screen.getByRole("link", { name: "Ople" }));
  expect(routing.push).toHaveBeenCalledWith("/");
  await interaction.click(screen.getByRole("button", { name: "내 플래너" }));
  expect(routing.push).toHaveBeenLastCalledWith("/planners");
});

it.each(["/privacy", "/terms"])(
  "%s에서는 공통 헤더와 계정 UI 없이 페이지 내용만 표시한다",
  async (path) => {
    routing.path = path;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json(user));
    const { container } = application();
    await act(async () => {});

    expect(screen.getByRole("main")).toHaveTextContent("페이지 내용");
    expect(container.querySelector("#app")).toBeNull();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    act(() => window.dispatchEvent(new Event("ople:login")));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  },
);

it("인증 확인 중 로그인을 비활성화하고 헤더와 전역 이벤트로 로그인 창을 연다", async () => {
  let finish = (_value: Response) => {};
  vi.spyOn(globalThis, "fetch").mockImplementation(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  application();
  expect(screen.getByRole("button", { name: "로그인" })).toBeDisabled();
  await act(async () => finish(new Response("{}", { status: 401 })));
  const interaction = userEvent.setup();
  await interaction.click(screen.getByRole("button", { name: "로그인" }));
  expect(screen.getByRole("dialog", { name: "로그인" })).toBeVisible();
  await interaction.click(screen.getByRole("button", { name: "닫기" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  act(() => window.dispatchEvent(new Event("ople:login")));
  expect(screen.getByRole("dialog", { name: "로그인" })).toBeVisible();
});

it("로그인 API 결과를 헤더와 계정 창에 반영하고 로그아웃 후 홈으로 이동한다", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (path) =>
      path === "/api/auth/me"
        ? new Response("{}", { status: 401 })
        : json(user),
    );
  application();
  const interaction = userEvent.setup();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "로그인" })).toBeEnabled(),
  );
  await interaction.click(screen.getByRole("button", { name: "로그인" }));
  const login = screen.getByRole("dialog", { name: "로그인" });
  await interaction.type(within(login).getByLabelText("이메일"), user.email);
  await interaction.type(
    within(login).getByLabelText("비밀번호"),
    "password123",
  );
  await interaction.click(
    within(login).getByRole("button", { name: "로그인" }),
  );

  expect(await screen.findByRole("button", { name: "계정" })).toBeVisible();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledWith(
    "/api/auth/login",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ email: user.email, password: "password123" }),
    }),
  );
  await waitFor(() => expect(routing.replace).toHaveBeenCalledWith("/"));
  routing.replace.mockClear();
  await interaction.click(screen.getByRole("button", { name: "계정" }));
  const account = screen.getByRole("dialog", { name: "내 계정" });
  expect(within(account).getByText(user.name)).toBeVisible();
  expect(within(account).getByText(user.email)).toBeVisible();
  await interaction.click(
    within(account).getByRole("button", { name: "로그아웃" }),
  );

  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("button", { name: "로그인" })).toBeEnabled();
  expect(fetcher).toHaveBeenCalledWith(
    "/api/auth/logout",
    expect.objectContaining({ method: "POST" }),
  );
  expect(routing.replace).toHaveBeenCalledWith("/");
});
