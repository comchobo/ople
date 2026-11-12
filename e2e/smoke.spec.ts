import { expect, test } from "@playwright/test";

test("loads the product introduction", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "앞으로 5년,세 가지 계획으로 살펴보기",
  );
  await expect(
    page.getByRole("navigation", { name: "공통 탐색" }),
  ).toBeVisible();
});
