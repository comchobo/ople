// TEMP: 리뉴얼 스켈레톤 스모크 테스트. 실제 테스트 작성 시 교체/삭제.
import { expect, test } from "@playwright/test";

test("loads the placeholder home page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Ople" })).toBeVisible();
});
