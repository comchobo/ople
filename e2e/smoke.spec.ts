// TEMPORARY scaffold test: delete or replace when implementing the product.
import { expect, test } from "@playwright/test";

test("serves the temporary application", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("ople");
  await expect(page.getByRole("heading", { name: "ople", exact: true })).toBeVisible();
});
