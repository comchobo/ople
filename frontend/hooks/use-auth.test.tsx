import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Planner } from "@/api/core";
import { savePlanner } from "@/api/planners";
import { AuthProvider, useAuth } from "./use-auth";

const user = { id: "u", name: "사용자", email: "hello@example.com" };
const json = (value: unknown) => new Response(JSON.stringify(value));

it("초기 인증 확인 중 상태를 구분하고 사용자 정보를 공유한다", async () => {
  let resolve: (value: Response) => void = () => {};
  vi.spyOn(globalThis, "fetch").mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  expect(result.current.loading).toBe(true);
  expect(result.current.user).toBeNull();
  await act(async () => {
    resolve(json(user));
  });
  expect(result.current.loading).toBe(false);
  expect(result.current.user).toEqual(user);
});

it("늦게 도착한 초기 인증 응답이 새 로그인 결과를 덮어쓰지 않는다", async () => {
  let resolve: (value: Response) => void = () => {};
  vi.spyOn(globalThis, "fetch").mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  act(() => result.current.loggedIn(user));
  await act(async () => {
    resolve(json({ ...user, id: "old" }));
  });
  expect(result.current.user).toEqual(user);
  expect(result.current.loading).toBe(false);
});

it("미로그인 응답 후 로딩을 종료하고 저장 완료 뒤에 로그아웃한다", async () => {
  let finishSave = () => {};
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (path) => {
      if (path === "/api/auth/me") return new Response("{}", { status: 401 });
      if (path === "/api/planners/p")
        await new Promise<void>((resolve) => {
          finishSave = resolve;
        });
      return json({});
    });
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.user).toBeNull();
  act(() => result.current.loggedIn(user));
  const saving = savePlanner({
    id: "p",
    name: "계획",
    created_at: "",
    plans: [],
  } satisfies Planner);
  await waitFor(() =>
    expect(fetcher).toHaveBeenCalledWith("/api/planners/p", expect.anything()),
  );
  let loggingOut: Promise<void>;
  act(() => {
    loggingOut = result.current.logout();
  });
  expect(fetcher.mock.calls.some(([path]) => path === "/api/auth/logout")).toBe(
    false,
  );
  await act(async () => {
    finishSave();
    await saving;
    await loggingOut;
  });
  expect(result.current.user).toBeNull();
  expect(fetcher).toHaveBeenCalledWith(
    "/api/auth/logout",
    expect.objectContaining({ method: "POST" }),
  );
});
