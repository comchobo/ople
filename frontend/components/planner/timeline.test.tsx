import { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Timeline } from "./timeline";

let renderer: ReactTestRenderer;
const save = vi.fn();
const edit = vi.fn();
const handlers = new Map<string, (event: unknown) => void>();
const piece = {
  id: "p",
  plan_id: "a",
  title: "그림",
  description: "",
  category: "창작",
  start_month: 2,
  duration: 5,
};
const target = {
  setPointerCapture: vi.fn(),
  hasPointerCapture: () => false,
  releasePointerCapture: vi.fn(),
};

beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const events = {
    addEventListener: (name: string, action: (event: unknown) => void) =>
      handlers.set(name, action),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("window", events);
  vi.stubGlobal("document", events);
  save.mockClear();
  edit.mockClear();
  handlers.clear();
  await act(async () => {
    renderer = create(
      <Timeline
        pieces={[piece]}
        start="2026-11"
        disabled={false}
        edit={edit}
        save={save}
      />,
      {
        createNodeMock: () => ({
          contains: () => true,
          querySelector: () => ({
            getBoundingClientRect: () => ({ width: 840 }),
          }),
        }),
      },
    );
  });
});
afterEach(async () => {
  await act(async () => {
    renderer.unmount();
  });
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const body = () => {
  const node = renderer.root
    .findAllByType("button")
    .find((b) => String(b.props["aria-label"]).includes("편집"));
  if (!node) throw new Error("timeline piece button missing");
  return node;
};
const down = () =>
  body().props.onPointerDown({
    button: 0,
    currentTarget: target,
    clientX: 0,
    clientY: 0,
    pointerId: 1,
  });

it("opens the editor for a short press but does not save", async () => {
  await act(async () => {
    down();
    body().props.onPointerUp();
  });
  expect(edit).toHaveBeenCalledWith(piece);
  expect(save).not.toHaveBeenCalled();
});

it("lets scrolling cancel a pending long press without editing or moving", async () => {
  await act(async () => {
    down();
    body().props.onPointerMove({ clientX: 0, clientY: 20 });
    vi.advanceTimersByTime(500);
    body().props.onPointerUp();
  });
  expect(edit).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
});

it("previews a long-press move and persists once on pointer release", async () => {
  await act(async () => {
    down();
    vi.advanceTimersByTime(500);
  });
  await act(async () => {
    body().props.onPointerMove({ clientX: 28, clientY: 0 });
  });
  expect(save).not.toHaveBeenCalled();
  await act(async () => {
    body().props.onPointerUp();
  });
  expect(save).toHaveBeenCalledExactlyOnceWith({ ...piece, start_month: 4 });
});

it("discards interrupted movement on Escape or pointer cancellation", async () => {
  await act(async () => {
    down();
    vi.advanceTimersByTime(500);
  });
  await act(async () => {
    body().props.onPointerMove({ clientX: 28, clientY: 0 });
    handlers.get("keydown")?.({ key: "Escape" });
  });
  await act(async () => {
    body().props.onPointerUp();
  });
  expect(save).not.toHaveBeenCalled();
});
