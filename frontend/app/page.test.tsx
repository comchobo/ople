import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("../components/app-shell", () => ({
  useAppShell: () => ({ start: () => {} }),
}));
it("explains the three futures and offers both start actions", () => {
  const html = renderToStaticMarkup(<Home />);
  for (const text of [
    "앞으로 5년",
    "왜 세 가지 계획인가요?",
    "현재 방향을 발전시키면",
    "다른 방향을 탐색하면",
    "원하는 삶에서 출발하면",
    "Plan A",
    "이용 과정",
  ])
    expect(html).toContain(text);
  expect(html.match(/시작하기/g)?.length).toBeGreaterThanOrEqual(2);
});
