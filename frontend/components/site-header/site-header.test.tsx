import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";

import SiteHeader from "./site-header";

it("links to the introduction and shows the login action for guests", () => {
  const html = renderToStaticMarkup(<SiteHeader isSignedIn={false} />);

  expect(html).toMatch(/<a[^>]*href="\/"[^>]*>Ople<\/a>/);
  expect(html).toContain(">로그인</button>");
  expect(html).not.toContain("내 플래너");
  expect(html).not.toContain("내 계정");
});

it("shows planner and account actions for signed-in users", () => {
  const html = renderToStaticMarkup(<SiteHeader isSignedIn />);

  expect(html).toContain(">내 플래너</button>");
  expect(html).toContain(">내 계정</button>");
  expect(html).not.toContain("로그인");
});
