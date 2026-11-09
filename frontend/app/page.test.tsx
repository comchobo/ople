// TEMP: 리뉴얼 스켈레톤 스모크 테스트. 실제 테스트 작성 시 교체/삭제.
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";

import Home from "./page";

it("renders the placeholder home page", () => {
  const html = renderToStaticMarkup(<Home />);

  expect(html).toContain("Ople");
});
