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
        pieces: [],
        scores: null,
      })),
    });
  await act(async () => {
    renderer = create(<Board id="planner" />);
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
    .find((node) => node.children.join("") === label);

it("keeps a failed plan edit in the form and retries the same confirmed draft", async () => {
  await act(async () => {
    button("계획 편집")?.props.onClick();
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
    button("평가 입력")?.props.onClick();
  });
  expect(
    renderer.root.findAllByType("input").map((node) => node.props.value),
  ).toEqual([5, 5, 5, 5]);
  await act(async () => {
    button("취소")?.props.onClick();
  });
  expect(api).toHaveBeenCalledTimes(1);
  expect(
    renderer.root
      .findAllByType("dd")
      .every((node) => node.children.join("") === "미평가"),
  ).toBe(true);
});

it("requires a fresh Apply when a failed confirmed draft is edited again", async () => {
  await act(async () => {
    button("계획 편집")?.props.onClick();
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
