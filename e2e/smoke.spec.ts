import { expect, test } from "@playwright/test";

test("loads the product introduction", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Ople 제품 소개" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "앞으로 5년, 세 가지 계획으로 살펴보기" }),
  ).toBeVisible();
});

test("keeps focus in the login modal and restores it on dismissal", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "로그인", exact: true });
  const dialog = page.getByRole("dialog", { name: "로그인" });
  const close = dialog.getByRole("button", { name: "닫기" });
  const googleLogin = dialog.getByRole("link", { name: "Google로 계속하기" });

  await trigger.click();
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(googleLogin).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(googleLogin).toBeFocused();

  await close.click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.mouse.click(1, 1);
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
