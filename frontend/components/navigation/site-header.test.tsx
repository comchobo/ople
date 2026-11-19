import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { savePlanner } from "@/api/planners";
import { AuthProvider } from "@/hooks/auth/use-auth";
import { setInterviewActive } from "@/hooks/use-app-navigation";
import { SiteHeader } from "./site-header";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const account = { id: "u", name: "사용자", email: "hello@example.com" };
const json = (value: unknown) => new Response(JSON.stringify(value));

beforeEach(() => {
  router.push.mockReset();
  router.replace.mockReset();
  window.history.replaceState({}, "", "/");
});
afterEach(() => setInterviewActive(false));

function renderHeader() {
  return render(
    <AuthProvider>
      <SiteHeader />
    </AuthProvider>,
  );
}

it("인증 확인 중 로그인을 막고 이메일 로그인 후 계정 UI와 홈 이동을 제공한다", async () => {
  let resolveMe = (_response: Response) => {};
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveMe = resolve;
        }),
    )
    .mockResolvedValueOnce(json(account));
  renderHeader();
  expect(screen.getByRole("button", { name: "로그인" })).toBeDisabled();
  await act(async () => resolveMe(new Response("{}", { status: 401 })));
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "로그인" }));
  const dialog = within(screen.getByRole("dialog", { name: "로그인" }));
  await user.type(dialog.getByLabelText("이메일"), account.email);
  await user.type(dialog.getByLabelText("비밀번호"), "password123");
  await user.click(dialog.getByRole("button", { name: "로그인" }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "계정" })).toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledWith(
    "/api/auth/login",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ email: account.email, password: "password123" }),
    }),
  );
});

it("계정의 플래너 이동 취소 시 모달을 유지하고 이동 완료 시 닫는다", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json(account));
  renderHeader();
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "계정" }));
  const dialog = within(screen.getByRole("dialog", { name: "내 계정" }));
  expect(dialog.getByText(account.email)).toBeInTheDocument();
  setInterviewActive(true);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  await user.click(dialog.getByRole("button", { name: "내 플래너" }));
  expect(router.push).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  confirm.mockReturnValue(true);
  await user.click(dialog.getByRole("button", { name: "내 플래너" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(router.push).toHaveBeenCalledWith("/planners");
});

it("로그아웃 취소와 API 오류 시 계정을 유지하고 성공하면 닫고 홈으로 이동한다", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(json(account))
    .mockResolvedValueOnce(
      new Response('{"detail":"로그아웃 실패"}', { status: 500 }),
    )
    .mockResolvedValueOnce(json({}));
  renderHeader();
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "계정" }));
  setInterviewActive(true);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  await user.click(screen.getByRole("button", { name: "로그아웃" }));
  expect(fetcher).toHaveBeenCalledTimes(1);
  confirm.mockReturnValue(true);
  await user.click(screen.getByRole("button", { name: "로그아웃" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("로그아웃 실패");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(router.replace).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "로그아웃" }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "로그인" })).toBeEnabled();
  expect(fetcher).toHaveBeenLastCalledWith(
    "/api/auth/logout",
    expect.objectContaining({ method: "POST" }),
  );
  expect(confirm).toHaveBeenCalledTimes(3);
});

it("외부 로그인 요청 이벤트를 처리하고 언마운트 시 리스너를 해제한다", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response("{}", { status: 401 }),
  );
  const remove = vi.spyOn(window, "removeEventListener");
  const { unmount } = renderHeader();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "로그인" })).toBeEnabled(),
  );
  act(() => {
    window.dispatchEvent(new Event("ople:login"));
  });
  expect(screen.getByRole("dialog", { name: "로그인" })).toBeInTheDocument();
  unmount();
  expect(remove).toHaveBeenCalledWith("ople:login", expect.any(Function));
  expect(remove).toHaveBeenCalledWith("ople:logout", expect.any(Function));
});

it("Google 인증 오류를 알리고 히스토리 메타데이터를 보존해 오류 쿼리를 제거한다", () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response("{}", { status: 401 }),
  );
  window.history.replaceState({ opleIndex: 3 }, "", "/?auth_error=1");
  renderHeader();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Google 로그인에 실패했습니다",
  );
  expect(window.location.search).toBe("");
  expect(window.history.state).toEqual({ opleIndex: 3 });
});

it("소개 섹션 링크도 인터뷰 이탈 확인과 진행 중인 API 저장을 기다린다", async () => {
  let resolveSave = (_response: Response) => {};
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (url) => {
      if (url === "/api/auth/me") return json(account);
      return new Promise<Response>((resolve) => {
        resolveSave = resolve;
      });
    });
  renderHeader();
  await screen.findByRole("button", { name: "계정" });
  const pending = savePlanner({
    id: "saved",
    name: "나의 미래",
    created_at: "2026-11-19",
    plans: [],
  });
  await waitFor(() =>
    expect(fetcher).toHaveBeenCalledWith(
      "/api/planners/saved",
      expect.objectContaining({ method: "PUT" }),
    ),
  );
  setInterviewActive(true);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const user = userEvent.setup();
  await user.click(screen.getByRole("link", { name: "이용 방법" }));
  expect(router.push).not.toHaveBeenCalled();
  confirm.mockReturnValue(true);
  await user.click(screen.getByRole("link", { name: "이용 방법" }));
  expect(router.push).not.toHaveBeenCalled();
  await act(async () => {
    resolveSave(json({}));
    await pending;
  });
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/#method"));
});
