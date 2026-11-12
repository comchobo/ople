import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1194, height: 834 },
]) {
  test.describe(`tablet ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== "desktop",
        "Tablet keyboard checks use desktop Chromium.",
      );
      await page.goto("/");
    });

    test("start actions and all dismissal methods restore focus", async ({
      page,
    }) => {
      const start = page.getByRole("button", { name: "시작하기", exact: true });
      const lowerStart = page.getByRole("button", {
        name: "하단에서 시작하기",
      });
      const dialog = page.getByRole("dialog", { name: "로그인", exact: true });
      await start.click();
      await expect(dialog).toBeVisible();
      const close = dialog.getByRole("button", { name: "닫기" });
      await expect(close).toBeFocused();
      await expect(
        dialog.getByRole("button", { name: "Google로 계속하기" }),
      ).toBeDisabled();
      await expect(dialog).toContainText("로그인 기능 준비 중");
      await page.screenshot({
        path: `test-results/login-${viewport.width}x${viewport.height}.png`,
        animations: "disabled",
      });
      await page.keyboard.press("Tab");
      await expect(close).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(close).toBeFocused();
      await close.click();
      await expect(start).toBeFocused();

      await lowerStart.scrollIntoViewIfNeeded();
      await lowerStart.focus();
      await page.keyboard.press("Enter");
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(lowerStart).toBeFocused();

      const login = page.getByRole("button", { name: "로그인", exact: true });
      await login.click();
      await dialog.getByText("로그인 기능 준비 중", { exact: false }).click();
      await expect(dialog).toBeVisible();
      await page.mouse.click(5, 5);
      await expect(dialog).not.toBeVisible();
      await expect(login).toBeFocused();
    });

    test("columns scroll independently without hiding controls", async ({
      page,
    }) => {
      await page.screenshot({
        path: `test-results/intro-${viewport.width}x${viewport.height}.png`,
      });
      const columns = page.locator(".intro-layout > section");
      const frame = await page.locator(".app-frame").boundingBox();
      expect(frame).not.toBeNull();
      expect(frame?.width).toBeLessThanOrEqual(1194);
      expect(frame?.height).toBeLessThanOrEqual(834);
      for (const column of await columns.all()) {
        expect(
          await column.evaluate((el) => el.scrollWidth <= el.clientWidth),
        ).toBe(true);
        expect(await column.evaluate((el) => el.clientHeight > 0)).toBe(true);
      }
      const lowerStart = page.getByRole("button", {
        name: "하단에서 시작하기",
      });
      await lowerStart.scrollIntoViewIfNeeded();
      await expect(lowerStart).toBeInViewport();
      expect(await columns.first().evaluate((el) => el.scrollTop)).toBe(0);
      await columns.first().evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await expect(
        page.getByRole("heading", { name: "원하는 삶에서 출발하면" }),
      ).toBeInViewport();
      await expect(page.getByRole("banner")).toBeInViewport();
    });

    test("planner route returns to the introduction with heading focus", async ({
      page,
    }) => {
      await page.goto("/planners");
      await expect(
        page.getByRole("heading", { name: "내 플래너", exact: true }),
      ).toBeFocused();
      await expect(page.getByText("플래너 기능 준비 중입니다.")).toBeVisible();
      await page.getByRole("link", { name: "Ople 제품 소개" }).click();
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    });
  });
}
