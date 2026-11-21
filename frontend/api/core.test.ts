import { expect, it, vi } from "vitest";
import { getCurrentUser, login, logout, signup, verifyEmail } from "./auth";
import { ApiError, api } from "./core";

it("인증 요청에 세션 쿠키와 JSON 본문을 전달한다", async () => {
  const user = { id: "u", name: "사용자", email: "a@example.com" };
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => new Response(JSON.stringify(user)));
  expect(await getCurrentUser()).toEqual(user);
  expect(fetcher).toHaveBeenLastCalledWith("/api/auth/me", {
    method: "GET",
    credentials: "same-origin",
  });
  await signup(user.email, "password");
  expect(fetcher).toHaveBeenLastCalledWith("/api/auth/signup", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: "password" }),
  });
  expect(await login(user.email, "password")).toEqual(user);
  expect(fetcher).toHaveBeenLastCalledWith(
    "/api/auth/login",
    expect.objectContaining({
      body: JSON.stringify({ email: user.email, password: "password" }),
    }),
  );
  expect(await verifyEmail(user.email, "123456")).toEqual(user);
  expect(fetcher).toHaveBeenLastCalledWith(
    "/api/auth/verify",
    expect.objectContaining({
      body: JSON.stringify({ email: user.email, code: "123456" }),
    }),
  );
  await logout();
  expect(fetcher).toHaveBeenLastCalledWith(
    "/api/auth/logout",
    expect.objectContaining({
      method: "POST",
      body: "{}",
    }),
  );
});

it.each([
  ['{"detail":"이메일을 확인해주세요."}', "이메일을 확인해주세요."],
  ['{"detail":[{"msg":"invalid"}]}', "처리하지 못했습니다. 다시 시도해주세요."],
  ["Bad Gateway", "처리하지 못했습니다. 다시 시도해주세요."],
])("실패 응답의 사용자 메시지를 보존한다: %s", async (body, message) => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(body, { status: 502 }),
  );
  await expect(getCurrentUser()).rejects.toThrow(message);
});

it("네트워크 실패를 호출자에게 전달한다", async () => {
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
  await expect(getCurrentUser()).rejects.toThrow("offline");
});

it("추가 헤더를 JSON 헤더와 합치고 FormData의 Content-Type은 브라우저에 맡긴다", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => new Response("{}"));
  await api("/example", {}, "POST", { "Idempotency-Key": "key" });
  expect(fetcher).toHaveBeenLastCalledWith("/api/example", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "Idempotency-Key": "key" },
    body: "{}",
  });
  const form = new FormData();
  form.append("value", "example");
  await api("/example", form, "POST", { "X-Test": "yes" });
  expect(fetcher).toHaveBeenLastCalledWith("/api/example", {
    method: "POST",
    credentials: "same-origin",
    headers: { "X-Test": "yes" },
    body: form,
  });
});

it("공통 API 오류에 HTTP 상태·코드·상세 정보를 담는다", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ detail: "권한 오류", code: "DENIED" }), {
      status: 403,
    }),
  );
  const error = await getCurrentUser().catch((cause: unknown) => cause);
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toBeInstanceOf(Error);
  expect(error).toMatchObject({
    message: "권한 오류",
    status: 403,
    code: "DENIED",
    detail: "권한 오류",
  });
});
