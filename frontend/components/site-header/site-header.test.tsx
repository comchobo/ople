import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";

import SiteHeader from "./site-header";
import { SiteSessionProvider } from "./site-session";

it("links to the introduction and shows the login action for guests", () => {
  const html = renderToStaticMarkup(
    <SiteSessionProvider>
      <SiteHeader />
    </SiteSessionProvider>,
  );

  expect(html).toMatch(/<a[^>]*href="\/"[^>]*>Ople<\/a>/);
  expect(html).toContain(">로그인</button>");
  expect(html).not.toContain("내 플래너");
  expect(html).not.toContain("내 계정");
});
