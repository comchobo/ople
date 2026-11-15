import { expect, test } from "@playwright/test";

test("loads the product introduction", async ({ page }) => {
  await page.route("**/api/auth/me", (route) => route.fulfill({ status: 401 }));
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "앞으로 5년, 세 가지 계획으로 살펴보기",
    }),
  ).toBeVisible();
});
