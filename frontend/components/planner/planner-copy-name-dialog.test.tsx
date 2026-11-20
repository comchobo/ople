import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { PlannerCopyNameDialog } from "./planner-copy-name-dialog";

function props() {
  return {
    sourceName: "원본",
    existingNames: ["원본"],
    pending: false,
    error: null,
    submit: vi.fn(),
    close: vi.fn(),
  };
}

it("기존 이름과 겹치지 않는 후보를 표시하고 입력한 이름을 그대로 제출한다", async () => {
  const values = { ...props(), existingNames: ["원본", "원본(사본)"] };
  const user = userEvent.setup();
  render(<PlannerCopyNameDialog {...values} />);
  expect(screen.getByLabelText("사본 이름")).toHaveValue("원본(사본)(사본)");
  await user.clear(screen.getByLabelText("사본 이름"));
  await user.type(screen.getByLabelText("사본 이름"), "  내가 정한 이름  ");
  await user.click(screen.getByRole("button", { name: "사본 만들기" }));
  expect(values.submit).toHaveBeenCalledWith("내가 정한 이름");
});

it("이모지 100자를 허용하고 101자와 공백뿐인 입력은 제출하지 않는다", () => {
  const values = props();
  render(<PlannerCopyNameDialog {...values} />);
  const input = screen.getByLabelText("사본 이름");
  const submit = screen.getByRole("button", { name: "사본 만들기" });
  fireEvent.change(input, { target: { value: "😀".repeat(100) } });
  expect(submit).toBeEnabled();
  fireEvent.click(submit);
  expect(values.submit).toHaveBeenCalledWith("😀".repeat(100));
  fireEvent.change(input, { target: { value: "😀".repeat(101) } });
  expect(submit).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent("길이가 초과됩니다.");
  fireEvent.change(input, { target: { value: "  " } });
  expect(submit).toBeDisabled();
  expect(values.submit).toHaveBeenCalledTimes(1);
});

it("서버 오류 후 입력을 유지하고 새로 편집하면 이전 오류를 숨긴다", () => {
  const values = props();
  const { rerender } = render(<PlannerCopyNameDialog {...values} />);
  fireEvent.change(screen.getByLabelText("사본 이름"), {
    target: { value: "중복 이름" },
  });
  rerender(
    <PlannerCopyNameDialog
      {...values}
      error={new Error("이미 있는 이름입니다.")}
    />,
  );
  expect(screen.getByLabelText("사본 이름")).toHaveValue("중복 이름");
  expect(screen.getByRole("alert")).toHaveTextContent("이미 있는 이름입니다.");
  fireEvent.change(screen.getByLabelText("사본 이름"), {
    target: { value: "새 이름" },
  });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("제출 중에는 입력·취소·닫기·Escape·배경 클릭을 막는다", () => {
  const values = { ...props(), pending: true };
  render(<PlannerCopyNameDialog {...values} />);
  const dialog = screen.getByRole("dialog");
  expect(screen.getByLabelText("사본 이름")).toBeDisabled();
  expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "닫기" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "복제 중…" })).toBeDisabled();
  fireEvent.keyDown(dialog, { key: "Escape" });
  fireEvent.click(dialog);
  fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));
  expect(values.close).not.toHaveBeenCalled();
});

it("입력창 취소는 제출하지 않고 닫기만 호출한다", async () => {
  const values = props();
  render(<PlannerCopyNameDialog {...values} />);
  await userEvent.setup().click(screen.getByRole("button", { name: "취소" }));
  expect(values.close).toHaveBeenCalledTimes(1);
  expect(values.submit).not.toHaveBeenCalled();
});
