import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import PlannersPage from "./page";

it("shows three planners newest first with Korean creation times", () => {
  const html = renderToStaticMarkup(<PlannersPage />);
  expect(html).toContain("총 3개 · 최신 생성순");
  expect(html.indexOf("나의 플래너 3")).toBeLessThan(
    html.indexOf("나의 플래너 2"),
  );
  expect(html.indexOf("나의 플래너 2")).toBeLessThan(
    html.indexOf("나의 플래너 1"),
  );
  for (const day of [15, 14, 13]) {
    expect(html).toContain(`2026년 11월 ${day}일 오전 09:00`);
  }
  expect(html.match(/생성 · 계획 3개/g)).toHaveLength(3);
});

it("disables all planner actions without temporary notices or a footer", () => {
  const html = renderToStaticMarkup(<PlannersPage />);
  const buttons = html.match(/<button\b[^>]*>/g) ?? [];
  expect(buttons).toHaveLength(10);
  expect(buttons.every((button) => button.includes('disabled=""'))).toBe(true);
  for (const text of [
    "샘플",
    "준비 중",
    "이 브라우저에 저장됩니다",
    "로그아웃",
  ]) {
    expect(html).not.toContain(text);
  }
});
