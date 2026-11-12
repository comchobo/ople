import { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { api } from "../../lib/api";
import { Board } from "./board";

vi.mock("../../lib/api", () => ({ api: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

let renderer: ReactTestRenderer;
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const events = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("window", events);
  vi.stubGlobal("document", events);
  vi.mocked(api)
    .mockReset()
    .mockResolvedValueOnce({
      id: "planner",
      name: "나의 플래너",
      created_at: "2026-11-12T00:00:00Z",
      start_month: "2026-11",
      plans: ["A", "B", "C"].map((kind) => ({
        id: kind,
        kind,
        title: `${kind} 제목`,
        description: "설명",
        pieces: [
          {
            id: `piece-${kind}`,
            plan_id: kind,
            title: "첫 조각",
            description: "초안 내용",
            category: "일",
            start_month: 1,
            duration: 1,
          },
        ],
        scores: null,
      })),
    });
  await act(async () => {
    renderer = create(<Board id="planner" />, {
      createNodeMock: (node) =>
        node.type === "dialog"
          ? {
              open: false,
              showModal() {
                this.open = true;
              },
              close() {
                this.open = false;
              },
            }
          : null,
    });
  });
});
afterEach(async () => {
  await act(async () => {
    renderer.unmount();
  });
  vi.unstubAllGlobals();
});

const button = (label: string) =>
  renderer.root
    .findAllByType("button")
    .find(
      (node) => (node.props["aria-label"] ?? node.children.join("")) === label,
    );

it("keeps a failed plan edit in the form and retries the same confirmed draft", async () => {
  await act(async () => {
    button("계획 제목과 설명 수정")?.props.onClick();
  });
  await act(async () => {
    renderer.root
      .findByType("input")
      .props.onChange({ target: { value: "수정한 제목" } });
  });
  expect(
    renderer.root
      .findAllByProps({ role: "tab" })
      .every((tab) => tab.props.disabled),
  ).toBe(true);
  vi.mocked(api).mockRejectedValueOnce(new Error("저장 실패"));
  await act(async () => {
    await renderer.root
      .findByType("form")
      .props.onSubmit({ preventDefault() {} });
  });
  expect(renderer.root.findByType("input").props.value).toBe("수정한 제목");
  expect(
    renderer.root.findByProps({ role: "alert" }).children.join(""),
  ).toContain("저장 실패");
  vi.mocked(api).mockResolvedValueOnce({});
  await act(async () => {
    await button("다시 시도")?.props.onClick();
  });
  expect(api).toHaveBeenLastCalledWith("/plans/A", "PATCH", {
    title: "수정한 제목",
    description: "설명",
  });
  expect(renderer.root.findAllByType("form")).toHaveLength(0);
});

it("starts unrated input at five but cancellation never saves a rating", async () => {
  await act(async () => {
    button("평가하기")?.props.onClick();
  });
  expect(
    renderer.root.findAllByType("input").map((node) => node.props.value),
  ).toEqual([5, 5, 5, 5]);
  await act(async () => {
    button("닫기")?.props.onClick();
  });
  expect(api).toHaveBeenCalledTimes(1);
  expect(
    renderer.root
      .findAllByType("dd")
      .every((node) => node.children.join("") === "미평가"),
  ).toBe(true);
});

it("opens plan editing as a modal and cancels without saving", async () => {
  await act(async () => {
    button("계획 제목과 설명 수정")?.props.onClick();
  });
  const dialog = renderer.root.findByType("dialog");
  expect(dialog.props["aria-labelledby"]).toBeTruthy();
  await act(async () => {
    dialog.props.onCancel({ preventDefault() {} });
  });
  expect(renderer.root.findAllByType("form")).toHaveLength(0);
  expect(api).toHaveBeenCalledTimes(1);
});

it("requires a fresh Apply when a failed confirmed draft is edited again", async () => {
  await act(async () => {
    button("계획 제목과 설명 수정")?.props.onClick();
  });
  await act(async () => {
    renderer.root
      .findByType("input")
      .props.onChange({ target: { value: "첫 적용" } });
  });
  vi.mocked(api).mockRejectedValueOnce(new Error("저장 실패"));
  await act(async () => {
    await renderer.root
      .findByType("form")
      .props.onSubmit({ preventDefault() {} });
  });
  await act(async () => {
    renderer.root
      .findByType("input")
      .props.onChange({ target: { value: "새 편집" } });
    renderer.root.findByType("fieldset").props.onChange();
  });
  expect(button("다시 시도")).toBeUndefined();
  vi.mocked(api).mockResolvedValueOnce({});
  await act(async () => {
    await renderer.root
      .findByType("form")
      .props.onSubmit({ preventDefault() {} });
  });
  expect(api).toHaveBeenLastCalledWith("/plans/A", "PATCH", {
    title: "새 편집",
    description: "설명",
  });
});

it("allows cancelling a failed piece deletion and returns to the intact draft", async () => {
  const piece = renderer.root
    .findAllByType("button")
    .find((node) => String(node.props["aria-label"]).endsWith("개월, 편집"));
  await act(async () => {
    piece?.props.onClick({ detail: 0 });
  });
  await act(async () => {
    button("삭제")?.props.onClick();
  });
  vi.mocked(api).mockRejectedValueOnce(new Error("삭제 실패"));
  await act(async () => {
    await button("조각 삭제")?.props.onClick();
  });
  expect(button("취소")?.props.disabled).toBe(false);
  await act(async () => {
    renderer.root.findByType("dialog").props.onCancel({ preventDefault() {} });
  });
  expect(renderer.root.findByProps({ id: "piece-title" }).props.value).toBe(
    "첫 조각",
  );
  expect(
    renderer.root.findByProps({ id: "piece-description" }).props.value,
  ).toBe("초안 내용");
  expect(renderer.root.findAllByProps({ role: "alert" })).toHaveLength(0);
  expect(api).toHaveBeenCalledTimes(2);
});

it("allows cancelling a failed rating reset without discarding the rating draft", async () => {
  await act(async () => {
    button("평가하기")?.props.onClick();
  });
  vi.mocked(api).mockResolvedValueOnce({});
  await act(async () => {
    await renderer.root
      .findByType("form")
      .props.onSubmit({ preventDefault() {} });
  });
  await act(async () => {
    button("평가 수정")?.props.onClick();
  });
  await act(async () => {
    button("평가 초기화")?.props.onClick();
  });
  vi.mocked(api).mockRejectedValueOnce(new Error("초기화 실패"));
  await act(async () => {
    await button("평가 초기화")?.props.onClick();
  });
  expect(button("취소")?.props.disabled).toBe(false);
  await act(async () => {
    renderer.root.findByType("dialog").props.onCancel({ preventDefault() {} });
  });
  expect(
    renderer.root.findAllByType("input").map((node) => node.props.value),
  ).toEqual([5, 5, 5, 5]);
  expect(renderer.root.findAllByProps({ role: "alert" })).toHaveLength(0);
  expect(api).toHaveBeenCalledTimes(3);
});
