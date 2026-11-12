import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";

import Home from "./page";

it("renders the introduction title and description", () => {
  const html = renderToStaticMarkup(<Home />);

  expect(html).toContain("앞으로 5년,<br/>세 가지 계획으로 살펴보기");
  expect(html).toContain(
    "AI와의 음성 인터뷰로 생각을 정리하고,<br/>서로 다른 삶의 계획을 비교·수정합니다.",
  );
});

it("renders a start button", () => {
  const html = renderToStaticMarkup(<Home />);

  expect(html).toMatch(/<button\b[^>]*type="button"[^>]*>시작하기<\/button>/);
});

it("explains the three planning directions in A, B, C order", () => {
  const html = renderToStaticMarkup(<Home />);

  expect(html).toContain("왜 세 가지 계획인가요?");
  expect(html).toMatch(
    /Plan A.*현재 방향을 발전시키면.*Plan B.*다른 방향을 탐색하면.*Plan C.*원하는 삶에서 출발하면/,
  );
});

it("shows a Plan A timeline with five year markers and four activities", () => {
  const html = renderToStaticMarkup(<Home />);

  expect(html).toContain("Plan A · 결과 예시");
  expect(html.match(/<time\b/g)).toHaveLength(5);
  for (const activity of [
    "일 · 전문 역량 넓히기",
    "창작 · 주말 제작 모임",
    "관계 · 정기적인 만남",
    "휴식 · 한 달 지역 살기",
  ]) {
    expect(html).toContain(activity);
  }
});
