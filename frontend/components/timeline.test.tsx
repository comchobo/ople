import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Piece } from "@/api/core";
import { Timeline } from "./timeline";

it("길게 누른 활동을 월 단위로 옮기고 60개월 경계를 지킨다", () => {
  vi.useFakeTimers();
  const piece: Piece = {
    id: "one",
    title: "도전",
    description: "",
    category: "work",
    start: 2,
    duration: 6,
  };
  const change = vi.fn();
  const { container, unmount } = render(
    <Timeline pieces={[piece]} change={change} edit={vi.fn()} />,
  );
  const track = container.querySelector("#timeline-track");
  if (!track) throw new Error("timeline missing");
  vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
    width: 600,
  } as DOMRect);
  fireEvent.pointerDown(
    screen.getByRole("button", { name: /도전.*개월차부터/ }),
    { button: 0, clientX: 50, clientY: 0, pointerId: 1 },
  );
  act(() => {
    vi.advanceTimersByTime(450);
  });
  fireEvent.pointerMove(window, { clientX: 85, clientY: 0, pointerId: 1 });
  fireEvent.pointerUp(window, { pointerId: 1 });
  expect(change).toHaveBeenLastCalledWith([
    expect.objectContaining({ start: 6, duration: 6 }),
  ]);
  fireEvent.pointerDown(
    screen.getByRole("button", { name: /도전.*개월차부터/ }),
    { button: 0, clientX: 50, pointerId: 2 },
  );
  fireEvent.pointerMove(window, { clientX: 1000, pointerId: 2 });
  fireEvent.pointerUp(window, { pointerId: 2 });
  expect(change).toHaveBeenLastCalledWith([
    expect.objectContaining({ start: 54, duration: 6 }),
  ]);
  unmount();
  vi.useRealTimers();
});

it("길게 누르기 전 스크롤 동작은 활동을 움직이지 않는다", () => {
  vi.useFakeTimers();
  const change = vi.fn(),
    edit = vi.fn();
  const { unmount } = render(
    <Timeline
      pieces={[
        {
          id: "one",
          title: "도전",
          description: "",
          category: "work",
          start: 0,
          duration: 6,
        },
      ]}
      change={change}
      edit={edit}
    />,
  );
  fireEvent.pointerDown(
    screen.getByRole("button", { name: /도전.*개월차부터/ }),
    { button: 0, clientX: 0, clientY: 0, pointerId: 1 },
  );
  fireEvent.pointerMove(window, { clientX: 0, clientY: 20, pointerId: 1 });
  act(() => {
    vi.advanceTimersByTime(500);
  });
  fireEvent.pointerUp(window, { pointerId: 1 });
  expect(change).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("button", { name: "도전 시작 조절" }),
  ).not.toBeInTheDocument();
  unmount();
  vi.useRealTimers();
});
