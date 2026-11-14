import { expect, test } from "@playwright/test";

for (const entry of ["시작하기", "하단에서 시작하기", "로그인"]) {
  test(`temporary login from ${entry} opens planners`, async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: entry, exact: true });
    await trigger.focus();
    await trigger.press("Enter");
    const dialog = page.getByRole("dialog", { name: "로그인", exact: true });
    await expect(dialog.getByText(/임시 로그인/)).toBeVisible();
    const close = dialog.getByRole("button", { name: "닫기" });
    const google = dialog.getByRole("button", { name: "Google로 계속하기" });
    await expect(close).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(google).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(google).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.press("Enter");
    await google.focus();
    await google.press("Enter");
    await expect(page).toHaveURL(/\/planners$/);
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "내 플래너", exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole("link", { name: "내 플래너", exact: true }),
    ).toBeVisible();
  });
}

test("keeps temporary login through shared navigation and reload until logout", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.getByRole("button", { name: "Google로 계속하기" }).click();
  await expect(page).toHaveURL(/\/planners$/);
  await page.reload();
  await expect(page.getByRole("button", { name: "내 계정" })).toBeVisible();

  for (const entry of ["시작하기", "하단에서 시작하기"]) {
    await page.getByRole("link", { name: "Ople 제품 소개" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await page.getByRole("button", { name: entry, exact: true }).click();
    await expect(page).toHaveURL(/\/planners$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }

  await page.getByRole("link", { name: "Ople 제품 소개" }).click();
  await page.getByRole("link", { name: "내 플래너", exact: true }).click();
  await expect(page).toHaveURL(/\/planners$/);
  await page.getByRole("link", { name: "Ople 제품 소개" }).click();
  await page.getByRole("button", { name: "내 계정" }).click();
  await expect(page.getByRole("dialog").getByText("김민수")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("minsu@example.com"),
  ).toBeVisible();
  await page.getByRole("button", { name: "내 플래너 보기" }).click();
  await expect(page).toHaveURL(/\/planners$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "내 플래너", exact: true }),
  ).toBeFocused();

  await page.getByRole("button", { name: "내 계정" }).click();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "로그인", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "내 플래너", exact: true }),
  ).toHaveCount(0);
});
