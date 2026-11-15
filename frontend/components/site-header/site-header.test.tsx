import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";

import SiteHeader from "./site-header";

it("links to the introduction and shows the login action for guests", () => {
  const html = renderToStaticMarkup(<SiteHeader />);

  expect(html).toMatch(/<a[^>]*href="\/"[^>]*>Ople<\/a>/);
  expect(html).toContain(">로그인</button>");
  expect(html).not.toContain("내 플래너");
  expect(html).not.toContain("내 계정");
});
