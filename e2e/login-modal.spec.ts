import { expect, test } from "@playwright/test";

for (const dismissal of ["close button", "Escape", "backdrop"] as const) {
  test(`opens the login modal and dismisses it with the ${dismissal}`, async ({
    page,
  }) => {
    await page.goto("/");

    const login = page.getByRole("button", { name: "로그인", exact: true });
    const dialog = page.getByRole("dialog", { name: "로그인" });
    const close = dialog.getByRole("button", { name: "닫기" });
    await expect(dialog).toBeHidden();
    if (dismissal === "Escape") {
      await login.focus();
      await page.keyboard.press("Enter");
    } else {
      await login.click();
    }
    await expect(dialog).toBeVisible();
    await expect(close).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(close).toBeFocused();

    if (dismissal === "close button") {
      await close.click();
    } else if (dismissal === "Escape") {
      await page.keyboard.press("Escape");
    } else {
      await dialog.getByRole("heading", { name: "로그인" }).click();
      await expect(dialog).toBeVisible();
      await page.mouse.click(8, 8);
    }

    await expect(dialog).toBeHidden();
    await expect(login).toBeFocused();
  });
}
