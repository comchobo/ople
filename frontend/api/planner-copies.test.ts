import { expect, it, vi } from "vitest";
import type { Planner } from "./core";
import {
  copyPlanner,
  isPlannerCopyNameError,
  PlannerCopyError,
} from "./planner-copies";

const copied: Planner = {
  id: "copy",
  name: "원본(사본)",
  created_at: "2026-11-20",
  plans: [],
};

it.each([{}, { name: "직접 입력한 이름" }])(
  "복제 POST에 세션 쿠키·요청 키·이름 본문을 전달한다: %j",
  async (input) => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(copied), { status: 201 }));
    expect(await copyPlanner("원본/id", "request-key", input)).toEqual(copied);
    expect(fetcher).toHaveBeenCalledWith(
      `/api/planners/${encodeURIComponent("원본/id")}/duplicate`,
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "request-key",
        },
        body: JSON.stringify(input),
      },
    );
  },
);

it.each([
  [409, "COPY_NAME_EXISTS", "이미 있는 이름입니다.", true],
  [422, "COPY_NAME_TOO_LONG", "길이가 초과됩니다.", true],
  [409, "IDEMPOTENCY_KEY_CONFLICT", "요청 충돌", false],
  [410, "COPY_DELETED", "복제된 플래너가 삭제되었습니다.", false],
  [500, "COPY_FAILED", "복제 실패", false],
  [500, "COPY_NAME_EXISTS", "잘못된 응답", false],
] as const)(
  "오류 상태와 코드를 보존한다: %s %s",
  async (status, code, message, needsName) => {
    const detail = { detail: message, code };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(detail), { status }),
    );
    const error = await copyPlanner("p", "key").catch(
      (cause: unknown) => cause,
    );
    expect(error).toBeInstanceOf(PlannerCopyError);
    expect(error).toMatchObject({ message, status, code, detail: message });
    expect(isPlannerCopyNameError(error)).toBe(needsName);
  },
);

it("이름 입력 검증 배열을 읽고 원본 오류 정보도 유지한다", async () => {
  const detail = [
    {
      loc: ["body", "name"],
      msg: "String should have at least 1 character",
      type: "string_too_short",
    },
  ];
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ detail }), { status: 422 }),
  );
  const error = await copyPlanner("p", "key", { name: "" }).catch(
    (cause: unknown) => cause,
  );
  expect(error).toMatchObject({
    status: 422,
    detail,
    message:
      "이름을 확인해주세요. 앞뒤 공백을 제외한 이름을 1~100자로 입력해주세요.",
  });
  expect(isPlannerCopyNameError(error)).toBe(true);
});

it("헤더와 이름의 복합 오류는 이름 수정만으로 해결할 오류로 분류하지 않는다", async () => {
  const detail = [
    { loc: ["header", "Idempotency-Key"], msg: "Invalid UUID" },
    { loc: ["body", "name"], msg: "Invalid name" },
  ];
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ detail }), { status: 422 }),
  );
  const error = await copyPlanner("p", "key").catch((cause: unknown) => cause);
  expect(error).toMatchObject({ status: 422, detail });
  expect(isPlannerCopyNameError(error)).toBe(false);
});

it.each(["null", "Bad Gateway"])(
  "알 수 없는 오류 응답에도 HTTP 상태를 유지한다: %s",
  async (body) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(body, { status: 502 }),
    );
    await expect(copyPlanner("p", "key")).rejects.toMatchObject({
      status: 502,
      code: undefined,
      message: "처리하지 못했습니다. 다시 시도해주세요.",
    });
  },
);

it("네트워크 실패는 응답을 받지 못한 오류로 호출자에게 전달한다", async () => {
  const offline = new TypeError("offline");
  vi.spyOn(globalThis, "fetch").mockRejectedValue(offline);
  await expect(copyPlanner("p", "key")).rejects.toBe(offline);
});
