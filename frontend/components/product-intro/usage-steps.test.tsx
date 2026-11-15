import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { SiteSessionProvider } from "../site-header/site-session";
import UsageSteps from "./usage-steps";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

it("renders the three steps in order and a start button below them", () => {
  const html = renderToStaticMarkup(
    <SiteSessionProvider>
      <UsageSteps />
    </SiteSessionProvider>,
  );
  const steps = Array.from(
    html.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g),
    (match) => match[1],
  );
  const button = html.match(
    /<button[^>]*aria-label="하단에서 시작하기"[^>]*>시작하기<\/button>/,
  );

  expect(steps).toEqual([
    "음성으로 답하기",
    "세 가지 계획 살펴보기",
    "내 계획으로 수정하기",
  ]);
  expect(button?.index).toBeGreaterThan(html.indexOf("</ol>"));
});
