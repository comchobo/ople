import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthProvider } from "@/hooks/auth/use-auth";
import { HomeScreen } from "./home-screen";

const routing = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => routing }));

const account = { id: "u", name: "사용자", email: "hello@example.com" };
const json = (value: unknown) => new Response(JSON.stringify(value));

beforeEach(() => {
  routing.push.mockReset();
  routing.replace.mockReset();
});

function renderHome() {
  return render(
    <AuthProvider>
      <HomeScreen />
    </AuthProvider>,
  );
}

function pendingAuth() {
  let resolve: (response: Response) => void = () => {};
  vi.spyOn(globalThis, "fetch").mockImplementation(
    () =>
      new Promise<Response>((done) => {
        resolve = done;
      }),
  );
  return (response: Response) => resolve(response);
}

it("인증 확인 전에 랜딩 화면을 먼저 표시한다", () => {
  pendingAuth();
  renderHome();
  expect(
    screen.getByRole("heading", { name: /하나의 정답 대신/ }),
  ).toBeVisible();
  expect(screen.queryByText("불러오는 중…")).not.toBeInTheDocument();
});

it("인증 확인 중 시작해도 확인된 사용자는 플래너 목록으로 이동한다", async () => {
  const resolve = pendingAuth();
  const login = vi.fn();
  window.addEventListener("ople:login", login);
  const user = userEvent.setup();
  renderHome();
  await user.click(
    screen.getByRole("button", { name: "나의 플래너 시작하기" }),
  );
  await act(async () => resolve(json(account)));
  await waitFor(() => expect(routing.push).toHaveBeenCalledWith("/planners"));
  expect(login).not.toHaveBeenCalled();
  window.removeEventListener("ople:login", login);
});

it("인증 확인 중 시작해도 확인된 비로그인 사용자의 로그인 창을 연다", async () => {
  const resolve = pendingAuth();
  const login = vi.fn();
  window.addEventListener("ople:login", login);
  const user = userEvent.setup();
  renderHome();
  await user.click(
    screen.getByRole("button", { name: "나의 플래너 시작하기" }),
  );
  expect(login).not.toHaveBeenCalled();
  await act(async () => resolve(new Response("{}", { status: 401 })));
  await waitFor(() => expect(login).toHaveBeenCalledTimes(1));
  expect(routing.push).not.toHaveBeenCalled();
  window.removeEventListener("ople:login", login);
});
