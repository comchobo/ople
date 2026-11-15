import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1194, height: 834 },
]) {
  test.describe(`planners ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "Tablet Chromium checks.");
      await page.goto("/planners");
    });

    test("shows the list and keeps unavailable actions disabled", async ({
      page,
    }) => {
      await expect(
        page.getByRole("heading", { name: "내 플래너", exact: true }),
      ).toBeFocused();
      const list = page.getByRole("list", { name: "저장한 플래너" });
      await expect(list.getByRole("listitem")).toHaveCount(3);
      for (const button of await page.locator("main button").all()) {
        await expect(button).toBeDisabled();
        await expect(button).toBeInViewport();
      }
      await expect(page.locator("main")).not.toContainText(/샘플|준비 중/);
      await page.screenshot({
        path: `test-results/planners-${viewport.width}x${viewport.height}.png`,
      });
      await page.getByRole("link", { name: "Ople 제품 소개" }).click();
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    });

    test("wraps long names and scrolls only the list with the keyboard", async ({
      page,
    }) => {
      const list = page.getByRole("list", { name: "저장한 플래너" });
      // Stress the actual rendered CSS without adding production fixture routes.
      await list.evaluate((element) => {
        const row = element.firstElementChild;
        if (!row) throw new Error("Missing planner row");
        const title = row.querySelector("h2 button");
        if (!title) throw new Error("Missing planner title");
        title.textContent = "긴플래너이름".repeat(20);
        for (let index = 0; index < 25; index++)
          element.append(row.cloneNode(true));
      });
      expect(
        await list.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
      const heading = page.getByRole("heading", {
        name: "내 플래너",
        exact: true,
      });
      const before = await heading.boundingBox();
      await list.focus();
      await page.keyboard.press("End");
      await expect
        .poll(() => list.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0);
      await expect(
        list
          .getByRole("listitem")
          .last()
          .getByRole("button", { name: /이름 변경/ }),
      ).toBeInViewport();
      expect(await heading.boundingBox()).toEqual(before);
      expect(
        await page.locator("main").evaluate((element) => element.scrollTop),
      ).toBe(0);
      expect(
        await page
          .locator("main")
          .evaluate((element) => element.scrollWidth <= element.clientWidth),
      ).toBe(true);
    });
  });
}
