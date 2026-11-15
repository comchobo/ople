import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { SiteSessionProvider } from "../site-header/site-session";
import ProductIntro from "./product-intro";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

it("renders the three plans and both start buttons", () => {
  const html = renderToStaticMarkup(
    <SiteSessionProvider>
      <ProductIntro />
    </SiteSessionProvider>,
  );

  expect(html).toContain("앞으로 5년");
  expect(html).toContain("Plan A");
  expect(html).toContain("Plan B");
  expect(html).toContain("Plan C");
  expect(html.match(/<button\b[^>]*>시작하기<\/button>/g)).toHaveLength(2);
});
