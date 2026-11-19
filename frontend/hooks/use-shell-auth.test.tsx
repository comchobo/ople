import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useShellAuth } from "./use-shell-auth";

const auth = vi.hoisted(() => ({
  user: null,
  loading: false,
  loggedIn: vi.fn(),
  logout: vi.fn(),
}));
const navigate = vi.hoisted(() => vi.fn());
vi.mock("./use-auth", () => ({ useAuth: () => auth }));
vi.mock("./use-app-navigation", () => ({
  useAppNavigation: () => navigate,
  confirmLeave: () => true,
}));

beforeEach(() => window.history.replaceState(null, "", "/"));

it("OAuth 오류를 표시하고 히스토리 상태를 보존하며 오류 쿼리를 제거한다", () => {
  window.history.replaceState({ previous: "home" }, "", "/?auth_error=denied");
  const { result, rerender } = renderHook(() => useShellAuth());
  expect(result.current.error).toBe(
    "Google 로그인에 실패했습니다. 다시 시도해주세요.",
  );
  expect(window.location.pathname + window.location.search).toBe("/");
  expect(window.history.state).toEqual({ previous: "home" });
  rerender();
  expect(result.current.error).toBe(
    "Google 로그인에 실패했습니다. 다시 시도해주세요.",
  );
});

it("인증 이벤트는 다시 렌더링해도 한 번 처리하고 언마운트 후에는 해제한다", async () => {
  const { result, rerender, unmount } = renderHook(() => useShellAuth());
  rerender();
  act(() => window.dispatchEvent(new Event("ople:login")));
  expect(result.current.auth).toBe(true);
  await act(async () => {
    window.dispatchEvent(new Event("ople:logout"));
  });
  expect(auth.logout).toHaveBeenCalledTimes(1);
  expect(navigate).toHaveBeenCalledExactlyOnceWith("/", true, true);
  unmount();
  await act(async () => {
    window.dispatchEvent(new Event("ople:login"));
    window.dispatchEvent(new Event("ople:logout"));
  });
  expect(auth.logout).toHaveBeenCalledTimes(1);
  expect(navigate).toHaveBeenCalledTimes(1);
});
