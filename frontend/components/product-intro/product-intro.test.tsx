import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";

import ProductIntro from "./product-intro";

it("renders the three plans and a disabled start button", () => {
  const html = renderToStaticMarkup(<ProductIntro />);

  expect(html).toContain("앞으로 5년");
  expect(html).toContain("Plan A");
  expect(html).toContain("Plan B");
  expect(html).toContain("Plan C");
  expect(html).toMatch(/<button\b[^>]*\bdisabled=""[^>]*>시작하기<\/button>/);
});
