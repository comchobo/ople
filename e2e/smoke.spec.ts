import { expect, test } from "@playwright/test";

for (const name of ["시작하기", "하단에서 시작하기"]) {
  test(`opens the login modal from ${name} for guests`, async ({ page }) => {
    await page.route("**/api/auth/me", (route) => route.fulfill({ status: 401 }));
    await page.goto("/");

    const start = page.getByRole("button", { name, exact: true });
    await start.click();
    const dialog = page.getByRole("dialog", { name: "로그인" });
    await expect(dialog.getByRole("link", { name: "Google로 계속하기" })).toBeVisible();
    await dialog.getByRole("button", { name: "닫기" }).click();
    await expect(start).toBeFocused();
  });

  test(`opens my planners from ${name} for signed-in users`, async ({ page }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        json: { id: "account-1", name: "김민수", email: "minsu@example.com", csrf_token: "test-token" },
      }),
    );
    await page.goto("/");
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page).toHaveURL(/\/planners$/);
    await expect(page.getByRole("heading", { name: "내 플래너" })).toBeVisible();
    await expect(page.getByText("로그인한 뒤 내 플래너를 확인해 주세요.", { exact: false })).toHaveCount(0);
  });
}

test("shows the login notice on my planners for guests", async ({ page }) => {
  await page.route("**/api/auth/me", (route) => route.fulfill({ status: 401 }));
  await page.goto("/planners");

  await expect(page.getByText("로그인한 뒤 내 플래너를 확인해 주세요.", { exact: false })).toBeVisible();
});

test("shows the account and restores the guest header after logout", async ({ page }) => {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: { id: "account-1", name: "김민수", email: "minsu@example.com", csrf_token: "test-token" },
    }),
  );
  await page.route("**/api/auth/logout", async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().headers()["x-csrf-token"]).toBe("test-token");
    await route.fulfill({ status: 204 });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "내 계정" }).click();
  const dialog = page.getByRole("dialog", { name: "내 계정" });
  await expect(dialog.getByText("김민수")).toBeVisible();
  await expect(dialog.getByText("minsu@example.com")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "내 플래너 보기" })).toHaveAttribute("href", "/planners");

  await dialog.getByRole("button", { name: "로그아웃" }).click();
  await expect(dialog).toBeHidden();
  const login = page.getByRole("button", { name: "로그인", exact: true });
  await expect(login).toBeFocused();
  await expect(page.getByRole("button", { name: "내 계정" })).toHaveCount(0);
});

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
