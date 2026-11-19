import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { PlanPreview } from "./plan-preview";

it("선택한 방향의 활동과 설명을 결과 예시로 보여준다", async () => {
  const user = userEvent.setup();
  render(<PlanPreview />);
  const panel = screen.getByRole("tabpanel");
  expect(within(panel).getByText("업무 경계 정하기")).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "B 다른 방향" }));
  expect(within(panel).queryByText("업무 경계 정하기")).not.toBeInTheDocument();
  expect(within(panel).getByText("관심 있는 분야 배우기")).toBeVisible();
  expect(panel).toHaveAccessibleName("B 다른 방향");
  expect(screen.getByText(/이해를 돕기 위한 결과 예시/)).toBeVisible();
});

it("방향키로 계획을 전환하고 Home과 End로 처음과 끝을 탐색한다", async () => {
  const user = userEvent.setup();
  render(<PlanPreview />);
  await user.tab();
  await user.keyboard("{ArrowLeft}");
  const last = screen.getByRole("tab", { name: "C 원하는 삶" });
  expect(last).toHaveFocus();
  expect(last).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveTextContent(
    "나만의 창작 프로젝트",
  );
  await user.keyboard("{Home}");
  expect(screen.getByRole("tab", { name: "A 현재의 발전" })).toHaveFocus();
  await user.keyboard("{End}{ArrowRight}");
  expect(screen.getByRole("tab", { name: "A 현재의 발전" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("tabpanel")).toHaveFocus();
});
