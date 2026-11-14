import { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { api } from "../../lib/api";
import { PlannerList } from "./planner-list";

vi.mock("../../lib/api", () => ({ api: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
let renderer: ReactTestRenderer;
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.mocked(api)
    .mockReset()
    .mockResolvedValueOnce([
      { id: "p", name: "나의 플래너", created_at: "2026-11-12T00:00:00Z" },
    ]);
  await act(async () => {
    renderer = create(<PlannerList />, {
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

it("cancels deletion without sending a DELETE and retains the planner", async () => {
  await act(async () => {
    button("나의 플래너 삭제")?.props.onClick();
  });
  expect(api).toHaveBeenCalledTimes(1);
  await act(async () => {
    renderer.root.findByType("dialog").props.onCancel({ preventDefault() {} });
  });
  expect(api).toHaveBeenCalledTimes(1);
  expect(renderer.root.findAllByType("li")).toHaveLength(1);
});

it("retains the rename draft after a failed save and retries it in the same modal", async () => {
  await act(async () => {
    button("나의 플래너 이름 변경")?.props.onClick();
  });
  await act(async () => {
    renderer.root
      .findByType("input")
      .props.onChange({ target: { value: "새 이름" } });
  });
  vi.mocked(api).mockRejectedValueOnce(new Error("저장 실패"));
  await act(async () => {
    await renderer.root
      .findByType("form")
      .props.onSubmit({ preventDefault() {} });
  });
  expect(renderer.root.findByType("input").props.value).toBe("새 이름");
  vi.mocked(api).mockResolvedValueOnce({});
  await act(async () => {
    await renderer.root
      .findByType("form")
      .props.onSubmit({ preventDefault() {} });
  });
  expect(api).toHaveBeenLastCalledWith("/planners/p", "PATCH", {
    name: "새 이름",
  });
  expect(renderer.root.findAllByType("form")).toHaveLength(0);
});
