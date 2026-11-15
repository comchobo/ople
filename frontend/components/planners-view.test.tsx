import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { PlannersView } from "./planners-view";

it("shows the prototype empty state when there are no planners", () => {
  const html = renderToStaticMarkup(<PlannersView planners={[]} />);
  expect(html).toContain("아직 플래너가 없습니다");
  expect(html).toContain("한 번의 인터뷰로 세 가지 계획을 만들고");
  expect(html).not.toContain("최신 생성순");
  expect(html).not.toContain("<ul");
  expect(html).toContain("새 플래너 만들기");
});

it("gives every row action a planner-specific accessible name", () => {
  const html = renderToStaticMarkup(
    <PlannersView
      planners={[
        {
          id: "one",
          name: "나의 긴 플래너",
          createdAt: "2026-11-15T00:00:00Z",
        },
      ]}
    />,
  );
  for (const action of ["열기", "이름 변경", "삭제"]) {
    expect(html).toContain(`aria-label="나의 긴 플래너 ${action}"`);
  }
  expect(html).toContain('aria-label="저장한 플래너"');
  expect(html).toContain('tabindex="0"');
});
