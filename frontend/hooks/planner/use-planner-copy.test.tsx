import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Planner, User } from "@/api/core";
import { savePlanner } from "@/api/planners";
import { usePlannerCopy } from "./use-planner-copy";

const user: User = { id: "u", name: "사용자", email: "u@example.com" };
const source: Planner = {
  id: "p",
  name: "원본",
  created_at: "2026-11-20",
  plans: [],
};
const copied: Planner = { ...source, id: "copy", name: "원본(사본)" };
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status });

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function requestKey(options?: RequestInit) {
  return new Headers(options?.headers).get("Idempotency-Key");
}

it("원본 저장이 완료된 뒤 복제하고 같은 순간의 연속 실행을 막는다", async () => {
  const saving = deferred<Response>();
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (_, options) =>
      options?.method === "PUT" ? saving.promise : json(copied, 201),
    );
  void savePlanner(source);
  const { result } = renderHook(() => usePlannerCopy(user));
  let pending!: Promise<Planner | undefined>;
  act(() => {
    pending = result.current.start(source.id);
  });
  expect(result.current.status).toBe("saving");
  expect(result.current.pending).toBe(true);
  await act(async () => {
    expect(await result.current.start("other")).toBeUndefined();
  });
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  expect(fetcher.mock.calls[0][1]?.method).toBe("PUT");
  await act(async () => {
    saving.resolve(json(source));
    expect(await pending).toEqual(copied);
  });
  expect(fetcher.mock.calls.map(([, options]) => options?.method)).toEqual([
    "PUT",
    "POST",
  ]);
  expect(requestKey(fetcher.mock.calls[1][1])).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  expect(result.current).toMatchObject({
    status: "succeeded",
    pending: false,
    result: copied,
  });
});

it("원본 저장 실패를 이름 입력 오류와 구별하고 저장 회복 후 재시도한다", async () => {
  const id = "unsaved-source";
  let fail = true;
  const uuid = vi.spyOn(crypto, "randomUUID");
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (_, options) => {
      if (options?.method === "PUT")
        return fail
          ? json(
              { detail: [{ loc: ["body", "name"], type: "string_too_short" }] },
              422,
            )
          : json({ ...source, id });
      return json(copied, 201);
    });
  await expect(savePlanner({ ...source, id })).rejects.toThrow();
  const { result } = renderHook(() => usePlannerCopy(user));
  await act(async () => {
    await result.current.start(id);
  });
  expect(result.current).toMatchObject({
    status: "failed",
    failureStage: "saving",
    needsName: false,
    canRetry: true,
    pending: false,
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
  fail = false;
  await savePlanner({ ...source, id });
  await act(async () => {
    await result.current.retry();
  });
  expect(result.current.status).toBe("succeeded");
  expect(uuid).toHaveBeenCalledTimes(1);
  expect(requestKey(fetcher.mock.calls[2][1])).toBe(uuid.mock.results[0].value);
});

it.each(["network", "invalid-json", "server"])(
  "%s 실패 후 재시도는 키·원본·이름을 유지하고 새 복제는 새 키를 쓴다",
  async (failure) => {
    const input = { name: "처음 이름" };
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(async () => {
        if (failure === "network") throw new TypeError("offline");
        return failure === "invalid-json"
          ? new Response("truncated", { status: 201 })
          : json({ detail: "복제 실패", code: "COPY_FAILED" }, 500);
      })
      .mockImplementation(async () => json(copied, 201));
    const { result } = renderHook(() => usePlannerCopy(user));
    await act(async () => {
      await result.current.start(source.id, input);
    });
    expect(result.current).toMatchObject({
      status: "failed",
      canRetry: true,
      needsName: false,
    });
    input.name = "뒤늦게 바꾼 이름";
    await act(async () => {
      await result.current.submitName("다른 이름");
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.status).toBe("succeeded");
    const first = fetcher.mock.calls[0];
    const retry = fetcher.mock.calls[1];
    expect(retry).toEqual(first);
    expect(retry[1]?.body).toBe(JSON.stringify({ name: "처음 이름" }));
    await act(async () => {
      await result.current.start(source.id);
    });
    expect(requestKey(fetcher.mock.calls[2][1])).not.toBe(requestKey(first[1]));
    expect(fetcher.mock.calls[2][1]?.body).toBe("{}");
  },
);

it.each([
  [422, { detail: "길이가 초과됩니다.", code: "COPY_NAME_TOO_LONG" }],
  [409, { detail: "이미 있는 이름입니다.", code: "COPY_NAME_EXISTS" }],
  [422, { detail: [{ loc: ["body", "name"], type: "string_too_short" }] }],
] as const)(
  "이름 검증 거부 후에는 같은 키로 이름을 수정한다: %s %j",
  async (status, error) => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(error, status))
      .mockResolvedValueOnce(json(copied, 201));
    const { result } = renderHook(() => usePlannerCopy(user));
    await act(async () => {
      await result.current.start(source.id);
    });
    expect(result.current).toMatchObject({
      needsName: true,
      canRetry: false,
      status: "failed",
    });
    await act(async () => {
      await result.current.retry();
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.submitName("새로운 이름");
    });
    expect(result.current.status).toBe("succeeded");
    expect(requestKey(fetcher.mock.calls[1][1])).toBe(
      requestKey(fetcher.mock.calls[0][1]),
    );
    expect(fetcher.mock.calls[1][1]?.body).toBe(
      JSON.stringify({ name: "새로운 이름" }),
    );
  },
);

it.each([
  [401, undefined],
  [403, undefined],
  [404, undefined],
  [409, "IDEMPOTENCY_KEY_CONFLICT"],
  [410, "COPY_DELETED"],
] as const)(
  "복구할 수 없는 응답에는 재시도나 이름 수정을 실행하지 않는다: %s",
  async (status, code) => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        json({ detail: "요청을 확인해주세요.", code }, status),
      );
    const { result } = renderHook(() => usePlannerCopy(user));
    await act(async () => {
      await result.current.start(source.id);
    });
    expect(result.current).toMatchObject({
      pending: false,
      canRetry: false,
      needsName: false,
    });
    await act(async () => {
      await result.current.retry();
      await result.current.submitName("새 이름");
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  },
);

it.each([true, false])(
  "계정 전환 후 이전 성공·실패 응답과 실행 함수를 무시한다: %s",
  async (success) => {
    const late = deferred<Response>();
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockReturnValueOnce(late.promise)
      .mockResolvedValueOnce(json({ ...copied, id: "other-copy" }, 201));
    const { result, rerender } = renderHook(
      ({ account }) => usePlannerCopy(account),
      { initialProps: { account: user } },
    );
    const oldStart = result.current.start;
    let pending!: Promise<Planner | undefined>;
    act(() => {
      pending = result.current.start(source.id);
    });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    rerender({ account: { ...user, id: "other" } });
    expect(result.current).toMatchObject({
      status: "idle",
      error: null,
      result: null,
    });
    await act(async () => {
      expect(await oldStart(source.id)).toBeUndefined();
      late.resolve(
        success
          ? json(copied, 201)
          : json({ detail: "이전 계정 오류", code: "COPY_FAILED" }, 500),
      );
      expect(await pending).toBeUndefined();
    });
    expect(result.current.status).toBe("idle");
    await act(async () => {
      await result.current.start("other-source");
    });
    expect(result.current.result?.id).toBe("other-copy");
    expect(requestKey(fetcher.mock.calls[1][1])).not.toBe(
      requestKey(fetcher.mock.calls[0][1]),
    );
  },
);

it("저장을 기다리는 중 로그아웃하면 복제 요청을 보내지 않는다", async () => {
  const saving = deferred<Response>();
  const fetcher = vi.spyOn(globalThis, "fetch").mockReturnValue(saving.promise);
  void savePlanner({ ...source, id: "logout-source" });
  const { result, rerender } = renderHook(
    ({ account }: { account: User | null }) => usePlannerCopy(account),
    { initialProps: { account: user as User | null } },
  );
  let pending!: Promise<Planner | undefined>;
  act(() => {
    pending = result.current.start("logout-source");
  });
  rerender({ account: null });
  await act(async () => {
    saving.resolve(json(source));
    await pending;
  });
  expect(result.current.status).toBe("idle");
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][1]?.method).toBe("PUT");
});

it("같은 사용자 정보의 갱신은 진행 중 복제를 초기화하지 않는다", async () => {
  const late = deferred<Response>();
  vi.spyOn(globalThis, "fetch").mockReturnValue(late.promise);
  const { result, rerender } = renderHook(
    ({ account }) => usePlannerCopy(account),
    { initialProps: { account: user } },
  );
  let pending!: Promise<Planner | undefined>;
  act(() => {
    pending = result.current.start(source.id);
  });
  await waitFor(() => expect(result.current.status).toBe("copying"));
  rerender({ account: { ...user, name: "변경된 이름" } });
  await act(async () => {
    late.resolve(json(copied, 201));
    await pending;
  });
  expect(result.current.result).toEqual(copied);
});

it("언마운트 후 늦은 응답과 기존 실행 함수를 무시한다", async () => {
  const late = deferred<Response>();
  const fetcher = vi.spyOn(globalThis, "fetch").mockReturnValue(late.promise);
  const { result, unmount } = renderHook(() => usePlannerCopy(user));
  const start = result.current.start;
  const retry = result.current.retry;
  let pending!: Promise<Planner | undefined>;
  act(() => {
    pending = start(source.id);
  });
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  unmount();
  late.resolve(json(copied, 201));
  expect(await pending).toBeUndefined();
  expect(await start(source.id)).toBeUndefined();
  expect(await retry()).toBeUndefined();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
