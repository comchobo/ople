import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useAccountMenu } from "./use-account-menu";
import { setInterviewActive } from "./use-app-navigation";
import { AuthProvider } from "./use-auth";

const routing = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => routing }));
const user = { id: "u", name: "사용자", email: "hello@example.com" };
const json = (value: unknown) => new Response(JSON.stringify(value));

afterEach(() => {
  setInterviewActive(false);
  window.history.replaceState(null, "", "/");
  vi.clearAllMocks();
});

it("인터뷰 이탈을 취소하면 로그아웃 요청과 계정 창 닫기를 수행하지 않는다", async () => {
  const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(json(user));
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const { result } = renderHook(() => useAccountMenu(), {
    wrapper: AuthProvider,
  });
  await waitFor(() => expect(result.current.user).toEqual(user));
  act(() => result.current.setAccount(true));
  setInterviewActive(true);

  act(() => window.dispatchEvent(new Event("ople:logout")));

  expect(confirm).toHaveBeenCalledOnce();
  expect(fetcher.mock.calls.map(([path]) => path)).toEqual(["/api/auth/me"]);
  expect(result.current.account).toBe(true);
  expect(result.current.user).toEqual(user);
  expect(routing.replace).not.toHaveBeenCalled();
});

it("로그아웃 실패는 계정 창과 세션을 유지하고 오류를 제공한다", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (path) =>
    path === "/api/auth/me"
      ? json(user)
      : new Response(JSON.stringify({ detail: "로그아웃 실패" }), {
          status: 500,
        }),
  );
  const { result } = renderHook(() => useAccountMenu(), {
    wrapper: AuthProvider,
  });
  await waitFor(() => expect(result.current.user).toEqual(user));
  act(() => result.current.setAccount(true));

  act(() => window.dispatchEvent(new Event("ople:logout")));

  await waitFor(() => expect(result.current.error).toBe("로그아웃 실패"));
  expect(result.current.account).toBe(true);
  expect(result.current.user).toEqual(user);
  expect(routing.replace).not.toHaveBeenCalled();
});

it("계정 창에서 플래너로 이동할 때 이탈 확인에 동의해야 창을 닫는다", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json(user));
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const { result } = renderHook(() => useAccountMenu(), {
    wrapper: AuthProvider,
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.setAccount(true));
  setInterviewActive(true);

  await act(() => result.current.openPlanners());
  expect(result.current.account).toBe(true);
  expect(routing.push).not.toHaveBeenCalled();

  confirm.mockReturnValue(true);
  await act(() => result.current.openPlanners());
  expect(result.current.account).toBe(false);
  expect(routing.push).toHaveBeenCalledWith("/planners");
});

it("인증 오류 쿼리를 소비하고 마운트 해제 후 전역 로그아웃을 처리하지 않는다", async () => {
  window.history.replaceState({ preserved: true }, "", "/?auth_error=1");
  const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(json(user));
  const { result, unmount } = renderHook(() => useAccountMenu(), {
    wrapper: AuthProvider,
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBe(
    "Google 로그인에 실패했습니다. 다시 시도해주세요.",
  );
  expect(window.location.search).toBe("");
  expect(window.history.state).toEqual({ preserved: true });

  unmount();
  window.dispatchEvent(new Event("ople:logout"));
  expect(fetcher.mock.calls.map(([path]) => path)).toEqual(["/api/auth/me"]);
});
