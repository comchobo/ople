import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";

import PlanResultExample from "./plan-result-example";

afterEach(() => {
  vi.useRealTimers();
});

it("shows five yearly ticks from the current month in Seoul", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-30T15:00:00Z"));

  const html = renderToStaticMarkup(<PlanResultExample />);

  expect(
    Array.from(
      html.matchAll(/<time datetime="([^"]+)">/gi),
      (match) => match[1],
    ),
  ).toEqual(["2026-12", "2027-12", "2028-12", "2029-12", "2030-12"]);
  expect(html).toContain("Plan A · 결과 예시");
  expect(html).toContain("일 · 전문 역량 넓히기");
  expect(html).toContain("창작 · 주말 제작 모임");
  expect(html).toContain("관계 · 정기적인 만남");
  expect(html).toContain("휴식 · 한 달 지역 살기");
});
