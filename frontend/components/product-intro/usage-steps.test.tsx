import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";

import UsageSteps from "./usage-steps";

it("renders the three steps in order and a disabled start button below them", () => {
  const html = renderToStaticMarkup(<UsageSteps />);
  const steps = Array.from(
    html.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g),
    (match) => match[1],
  );
  const button = html.match(
    /<button[^>]*aria-label="하단에서 시작하기"[^>]*disabled=""[^>]*>시작하기<\/button>/,
  );

  expect(steps).toEqual([
    "음성으로 답하기",
    "세 가지 계획 살펴보기",
    "내 계획으로 수정하기",
  ]);
  expect(button?.index).toBeGreaterThan(html.indexOf("</ol>"));
});
