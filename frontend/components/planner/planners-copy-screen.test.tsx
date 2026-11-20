import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import type { Planner } from "@/api/core";
import { savePlanner } from "@/api/planners";
import { AuthProvider } from "@/hooks/auth/use-auth";
import { PlannersScreen } from "./planners-screen";

const routing = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => routing }));

const source: Planner = {
  id: "source",
  name: "원본",
  created_at: "2020-01-01",
  plans: [],
};
const copied: Planner = {
  id: "copy",
  name: "원본(사본)",
  created_at: "2026-11-20",
  plans: [],
};
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function mockApi(
  duplicate: (
    body: { name?: string },
    options?: RequestInit,
  ) => Promise<Response>,
  values = [source],
  save: () => Promise<Response> = async () => json(source),
) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (path, options) => {
      if (path === "/api/auth/me")
        return json({ id: "u", name: "사용자", email: "u@example.com" });
      if (path === "/api/generations") return json([]);
      if (options?.method === "PUT") return save();
      if (String(path).endsWith("/duplicate"))
        return duplicate(JSON.parse(String(options?.body)), options);
      if (path === "/api/planners") return json(values);
      throw new Error(`Unexpected request: ${String(path)}`);
    });
}
function application() {
  return render(
    <AuthProvider>
      <PlannersScreen />
    </AuthProvider>,
  );
}
function copyCalls(fetcher: ReturnType<typeof mockApi>) {
  return fetcher.mock.calls.filter(([path]) =>
    String(path).endsWith("/duplicate"),
  );
}

it("복제 성공 시 목록 맨 위에 사본과 성공 안내를 표시하고 목록에 머문다", async () => {
  const fetcher = mockApi(async () => json(copied, 201));
  application();
  await userEvent
    .setup()
    .click(await screen.findByRole("button", { name: "원본 복제" }));
  expect(await screen.findByText("플래너를 복제했습니다.")).toBeVisible();
  const rows = within(screen.getByRole("list")).getAllByRole("listitem");
  expect(rows).toHaveLength(2);
  expect(
    within(rows[0]).getByRole("button", { name: copied.name }),
  ).toBeVisible();
  expect(within(rows[0]).getByText("새 사본")).toBeVisible();
  expect(screen.getByText("플래너 2개")).toBeVisible();
  expect(routing.push).not.toHaveBeenCalled();
  expect(copyCalls(fetcher)).toHaveLength(1);
  expect(
    fetcher.mock.calls.filter(([path]) => path === "/api/planners"),
  ).toHaveLength(1);
});

it("원본 저장 확인과 복제 중에는 해당 원본 편집·삭제를 막고 중복 요청하지 않는다", async () => {
  const saving = deferred<Response>();
  const copying = deferred<Response>();
  const other = { ...source, id: "other", name: "다른 계획" };
  const fetcher = mockApi(
    async () => copying.promise,
    [source, other],
    async () => saving.promise,
  );
  const user = userEvent.setup();
  application();
  const button = await screen.findByRole("button", {
    name: "원본 복제",
  });
  void savePlanner(source);
  await user.click(button);
  try {
    expect(
      await screen.findByText("원본 저장을 확인하고 있습니다."),
    ).toBeVisible();
    const row = button.closest("li");
    if (!row) throw new Error("Source row missing");
    expect(within(row).getByRole("button", { name: "원본" })).toBeDisabled();
    expect(
      within(row).getByRole("button", { name: "이름 변경" }),
    ).toBeDisabled();
    expect(within(row).getByRole("button", { name: "삭제" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "다른 계획" })).toBeEnabled();
    expect(copyCalls(fetcher)).toHaveLength(0);
    await act(async () => {
      saving.resolve(json(source));
    });
    expect(
      await screen.findByText("플래너를 복제하고 있습니다."),
    ).toBeVisible();
    await user.dblClick(button);
    expect(copyCalls(fetcher)).toHaveLength(1);
  } finally {
    saving.resolve(json(source));
    await act(async () => {
      copying.resolve(json(copied, 201));
    });
  }
  await waitFor(() => expect(button).toBeEnabled());
});

it("길이 초과 안내에서 이름을 입력하고 중복 오류 후에도 입력을 유지해 재제출한다", async () => {
  const original = { ...source, id: "long", name: "가".repeat(100) };
  let attempt = 0;
  const fetcher = mockApi(
    async (body) => {
      attempt += 1;
      if (attempt === 1)
        return json(
          { detail: "길이가 초과됩니다.", code: "COPY_NAME_TOO_LONG" },
          422,
        );
      if (attempt === 2)
        return json(
          { detail: "이미 있는 이름입니다.", code: "COPY_NAME_EXISTS" },
          409,
        );
      return json({ ...copied, name: body.name }, 201);
    },
    [original],
  );
  const user = userEvent.setup();
  application();
  await user.click(
    await screen.findByRole("button", {
      name: `${original.name} 복제`,
    }),
  );
  const dialog = await screen.findByRole("dialog", { name: "사본 이름 입력" });
  expect(within(dialog).getByRole("alert")).toHaveTextContent(
    "길이가 초과됩니다.",
  );
  expect(
    within(dialog).getByRole("button", { name: "사본 만들기" }),
  ).toBeDisabled();
  const input = within(dialog).getByLabelText("사본 이름");
  await user.clear(input);
  await user.type(input, "중복 이름");
  await user.click(within(dialog).getByRole("button", { name: "사본 만들기" }));
  expect(
    await within(dialog).findByText("이미 있는 이름입니다."),
  ).toBeVisible();
  expect(input).toHaveValue("중복 이름");
  await user.clear(input);
  await user.type(input, "내가 정한 사본");
  await user.click(within(dialog).getByRole("button", { name: "사본 만들기" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("button", { name: "내가 정한 사본" })).toBeVisible();
  const requests = copyCalls(fetcher).map(([, options]) => ({
    key: new Headers(options?.headers).get("Idempotency-Key"),
    body: JSON.parse(String(options?.body)),
  }));
  expect(new Set(requests.map((item) => item.key)).size).toBe(1);
  expect(requests.map((item) => item.body)).toEqual([
    {},
    { name: "중복 이름" },
    { name: "내가 정한 사본" },
  ]);
});

it.each(["button", "escape"])(
  "이름 입력 취소는 추가 복제를 요청하지 않는다: %s",
  async (kind) => {
    const fetcher = mockApi(async () =>
      json({ detail: "길이가 초과됩니다.", code: "COPY_NAME_TOO_LONG" }, 422),
    );
    const user = userEvent.setup();
    application();
    await user.click(await screen.findByRole("button", { name: "원본 복제" }));
    const dialog = await screen.findByRole("dialog");
    if (kind === "button")
      await user.click(within(dialog).getByRole("button", { name: "취소" }));
    else fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(copyCalls(fetcher)).toHaveLength(1);
    expect(screen.getByRole("button", { name: "원본 복제" })).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  },
);

it("응답 유실 후 같은 키로 재시도하고 이미 목록에 있는 사본은 중복 반영하지 않는다", async () => {
  let attempt = 0;
  const fetcher = mockApi(async () => {
    if (++attempt === 1) throw new TypeError("connection lost");
    return json(copied, 201);
  }, [copied, source]);
  const user = userEvent.setup();
  application();
  await user.click(await screen.findByRole("button", { name: "원본 복제" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "복제 결과를 확인하지 못했습니다.",
  );
  expect(screen.getByRole("button", { name: "원본 복제" })).toBeDisabled();
  await user.click(
    screen.getByRole("button", { name: "플래너 복제 다시 시도" }),
  );
  expect(await screen.findByText("플래너를 복제했습니다.")).toBeVisible();
  expect(
    within(screen.getByRole("list")).getAllByRole("listitem"),
  ).toHaveLength(2);
  const calls = copyCalls(fetcher);
  expect(calls[1]).toEqual(calls[0]);
});

it("원본 저장 실패 시 복제하지 않고 저장 회복 후 재시도한다", async () => {
  const original = { ...source, id: "failed-save" };
  let failed = true;
  const fetcher = mockApi(
    async () => json(copied, 201),
    [original],
    async () =>
      failed ? json({ detail: "자동 저장 실패" }, 500) : json(original),
  );
  const user = userEvent.setup();
  application();
  const button = await screen.findByRole("button", {
    name: "원본 복제",
  });
  await expect(savePlanner(original)).rejects.toThrow("자동 저장 실패");
  await user.click(button);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "원본을 저장하지 못해 복제하지 않았습니다.",
  );
  expect(copyCalls(fetcher)).toHaveLength(0);
  failed = false;
  await savePlanner(original);
  await user.click(
    screen.getByRole("button", { name: "플래너 복제 다시 시도" }),
  );
  expect(await screen.findByText("플래너를 복제했습니다.")).toBeVisible();
  expect(copyCalls(fetcher)).toHaveLength(1);
});

it.each([404, 410])(
  "재시도할 수 없는 오류를 안내하고 새 복제 버튼을 복구한다: %s",
  async (status) => {
    mockApi(async () =>
      json(
        {
          detail: "복제할 플래너를 확인해주세요.",
          code: status === 410 ? "COPY_DELETED" : undefined,
        },
        status,
      ),
    );
    application();
    await userEvent
      .setup()
      .click(await screen.findByRole("button", { name: "원본 복제" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "복제할 플래너를 확인해주세요.",
    );
    expect(
      screen.queryByRole("button", { name: "플래너 복제 다시 시도" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "원본 복제" })).toBeEnabled();
  },
);

it("직접 입력한 이름으로 복제하다 응답이 유실되면 입력창을 닫고 같은 내용으로 재시도한다", async () => {
  let attempt = 0;
  const fetcher = mockApi(async (body) => {
    if (++attempt === 1)
      return json(
        { detail: "길이가 초과됩니다.", code: "COPY_NAME_TOO_LONG" },
        422,
      );
    if (attempt === 2) throw new TypeError("connection lost");
    return json({ ...copied, name: body.name }, 201);
  });
  const user = userEvent.setup();
  application();
  await user.click(await screen.findByRole("button", { name: "원본 복제" }));
  const dialog = await screen.findByRole("dialog");
  const input = within(dialog).getByRole("textbox", { name: "사본 이름" });
  await user.clear(input);
  await user.type(input, "다시 찾을 사본");
  await user.click(within(dialog).getByRole("button", { name: "사본 만들기" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "복제 결과를 확인하지 못했습니다.",
  );
  await user.click(
    screen.getByRole("button", { name: "플래너 복제 다시 시도" }),
  );
  expect(
    await screen.findByRole("button", { name: "다시 찾을 사본" }),
  ).toBeVisible();
  const calls = copyCalls(fetcher);
  expect(calls[2]).toEqual(calls[1]);
});
