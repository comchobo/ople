import { afterEach, expect, it, vi } from "vitest";
import { ApiError, api } from "./api";

afterEach(() => vi.unstubAllGlobals());

it("sends CSRF and the original WAV only on explicit mutation", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ csrf_token: "csrf" })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ answered: 1 })));
  vi.stubGlobal("fetch", fetcher);
  const audio = new Blob(["test"], { type: "audio/wav" });
  expect(
    await api("/interviews/id/answers/0/submission", "POST", audio),
  ).toEqual({ answered: 1 });
  expect(fetcher.mock.calls[1][1]).toMatchObject({
    body: audio,
    headers: { "Content-Type": "audio/wav", "X-CSRF-Token": "csrf" },
  });
});

it("does not silently reuse a duplicate submission", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ csrf_token: "csrf" })))
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "이미 사용된 제출 ID입니다." }), {
        status: 409,
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  await expect(
    api("/interviews/id/answers/0/submission", "POST", new Blob(["audio"])),
  ).rejects.toMatchObject({ status: 409 });
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it("does not submit mutations when the account is unauthenticated", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response("{}", { status: 401 }));
  vi.stubGlobal("fetch", fetcher);
  await expect(api("/planners/id", "DELETE")).rejects.toBeInstanceOf(ApiError);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
