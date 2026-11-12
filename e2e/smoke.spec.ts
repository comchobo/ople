import { expect, test } from "@playwright/test";

test("shows the introduction and start button", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /앞으로 5년,\s*세 가지 계획으로 살펴보기/,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "시작하기", exact: true }),
  ).toBeVisible();
});

test("shows the three usage steps in order", async ({ page }) => {
  await page.goto("/");

  const process = page.getByRole("region", { name: "이용 과정" });
  await expect(process.getByRole("heading", { level: 3 })).toHaveText([
    "음성으로 답하기",
    "세 가지 계획 살펴보기",
    "내 계획으로 수정하기",
  ]);
  const start = process.getByRole("button", { name: "하단에서 시작하기" });
  await start.scrollIntoViewIfNeeded();
  await expect(start).toBeInViewport();
});
