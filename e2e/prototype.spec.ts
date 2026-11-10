import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, type Locator, type Page, test } from "@playwright/test";

const STORAGE = "ople-tablet-planners-v1";

test.beforeEach(async ({ page }) => {
  await page.route("**/tablet-prototype", (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: readFileSync(
        resolve(__dirname, "../prototypes/PROTOTYPE.html"),
        "utf8",
      ),
    }),
  );
  await page.goto("/tablet-prototype");
});

async function bounds(locator: Locator) {
  const box = await locator.boundingBox();
  assert(box, "Expected a rendered element");
  return box;
}

async function login(page: Page) {
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.getByRole("button", { name: "Google로 계속하기" }).click();
  await expect(
    page.getByRole("heading", { name: "내 플래너", exact: true }),
  ).toBeVisible();
}

async function answerInterview(page: Page) {
  for (let index = 0; index < 3; index++) {
    await page.getByRole("button", { name: "답변 시작", exact: true }).click();
    await page.getByRole("button", { name: "일시정지", exact: true }).click();
    await page.getByRole("button", { name: "답변 제출", exact: true }).click();
  }
  await expect(
    page.getByRole("button", { name: "플래너 생성", exact: true }),
  ).toBeVisible();
}

async function createPlan(page: Page, number = 1) {
  if (await page.getByRole("button", { name: "로그인", exact: true }).count()) {
    await login(page);
  }
  await page
    .getByRole("button", { name: "새 플래너 만들기", exact: true })
    .click();
  await expectFrame(page);
  const preparationSteps = await bounds(page.locator(".steps"));
  await page.getByRole("button", { name: "인터뷰 시작", exact: true }).click();
  const question = await bounds(page.locator(".question"));
  const recorder = await bounds(page.locator(".record-panel"));
  expect(question.x + question.width).toBeLessThan(recorder.x);
  await expectFrame(page);
  await answerInterview(page);
  const summary = await bounds(page.locator(".complete .notice"));
  expect(await bounds(page.locator(".steps"))).toEqual(preparationSteps);
  const frame = await bounds(page.locator("#app"));
  expect(
    Math.abs(summary.x + summary.width / 2 - frame.x - frame.width / 2),
  ).toBeLessThan(2);
  await page.getByRole("button", { name: "플래너 생성", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: `나의 플래너 ${number}`, exact: true }),
  ).toBeVisible();
}

async function expectFrame(page: Page) {
  const frame = await bounds(page.locator("#app"));
  expect(frame.width).toBe(Math.min(page.viewportSize()?.width || 0, 1194));
  expect(frame.width).toBeLessThanOrEqual(1194);
  expect(frame.height).toBeLessThanOrEqual(834);
  expect(
    await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth > innerWidth,
      vertical: document.documentElement.scrollHeight > innerHeight,
    })),
  ).toEqual({ horizontal: false, vertical: false });
}

test("tablet-first frame and two-column screens retain the full interview flow", async ({
  page,
}) => {
  await expectFrame(page);
  const introColumns = page.locator(".intro-layout > section");
  await expect(introColumns).toHaveCount(2);
  const introLeft = await bounds(introColumns.nth(0));
  const introRight = await bounds(introColumns.nth(1));
  expect(introRight.x).toBeGreaterThanOrEqual(introLeft.x + introLeft.width);
  await createPlan(page);
  const timeline = await bounds(page.locator(".timeline-pane"));
  const details = await bounds(page.locator(".details-pane"));
  expect(timeline.width / details.width).toBeGreaterThan(1.8);
  expect(timeline.x).toBeLessThan(details.x);
  await expect(
    page.getByRole("button", { name: "AI로 이미지 만들기" }),
  ).toHaveCount(0);
  await expect(page.getByText("매일 보고 싶은 나의 미래")).toHaveCount(0);
  await expect(page.locator(".timeline-row")).toHaveCount(6);
  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await expectFrame(page);
    await page.getByRole("tab", { name: "Plan B", exact: true }).click();
    await expect(
      page.getByRole("tab", { name: "Plan B", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("tab", { name: "Plan C", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
  }
});

test("centered dialogs close below their bounds and restore focus", async ({
  page,
}) => {
  const login = page.getByRole("button", { name: "로그인", exact: true });
  await login.click();
  const dialog = page.getByRole("dialog");
  await expect
    .poll(async () => {
      const box = await bounds(dialog);
      return Math.abs(box.y + box.height / 2 - 834 / 2);
    })
    .toBeLessThan(2);
  const box = await bounds(dialog);
  expect(Math.abs(box.x + box.width / 2 - 1194 / 2)).toBeLessThan(2);
  await page.mouse.click(597, box.y + box.height + 20);
  await expect(dialog).not.toBeVisible();
  await expect(login).toBeFocused();
  await login.click();
  await page.keyboard.press("Escape");
  await expect(login).toBeFocused();
});

test("plan edits, new pieces and self-evaluation survive reload", async ({
  page,
}) => {
  await createPlan(page);
  await page.getByRole("button", { name: "계획 제목과 설명 수정" }).click();
  await page.getByLabel("제목", { exact: true }).fill("태블릿에서 세운 계획");
  await page.getByRole("button", { name: "적용", exact: true }).click();
  await page.getByRole("button", { name: "조각 추가", exact: true }).click();
  await page.getByLabel("제목", { exact: true }).fill("새로운 활동");
  await page.getByRole("button", { name: "적용", exact: true }).click();
  await page.getByRole("button", { name: "평가하기", exact: true }).click();
  await page.getByLabel("자원", { exact: true }).fill("8");
  await page.getByRole("button", { name: "평가 저장", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("ople-tablet-planners-v1") || "{}")
            .planners[0].plans[0].scores.resources,
      ),
    )
    .toBe(8);
  await page.reload();
  await page
    .getByRole("button", { name: "나의 플래너 1 열기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "태블릿에서 세운 계획" }),
  ).toBeVisible();
  await expect(page.locator(".timeline-row")).toHaveCount(7);
  await expect(page.locator(".rating-value").first()).toContainText("8 / 10");
});

test("long-press dragging and resizing use the tablet track width", async ({
  page,
}) => {
  await createPlan(page);
  const box = await bounds(page.locator(".piece").first());
  const track = await bounds(page.locator("#timeline-track"));
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.waitForTimeout(500);
  await page.mouse.move(box.x + 20 + track.width / 10, box.y + 20);
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("ople-tablet-planners-v1") || "{}")
            .planners[0].plans[0].pieces[0].start,
      ),
    )
    .toBe(6);
  const handle = await bounds(
    page.getByRole("button", { name: "업무 경계 정하기 종료 시점 조절" }),
  );
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 20);
  await page.mouse.down();
  await page.mouse.move(
    handle.x + handle.width / 2 + track.width / 10,
    handle.y + 20,
  );
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("ople-tablet-planners-v1") || "{}")
            .planners[0].plans[0].pieces[0].duration,
      ),
    )
    .toBe(18);
  await page.keyboard.press("Escape");
  await expect(page.locator(".piece.selected")).toHaveCount(0);
});

test("touch long press moves a piece while ordinary swipes scroll its pane", async ({
  page,
}) => {
  await createPlan(page);
  const session = await page.context().newCDPSession(page);
  const first = await bounds(page.locator(".piece").first());
  const track = await bounds(page.locator("#timeline-track"));
  const x = first.x + 20;
  const y = first.y + 20;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  await page.waitForTimeout(500);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x + track.width / 10, y }],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("ople-tablet-planners-v1") || "{}")
            .planners[0].plans[0].pieces[0].start,
      ),
    )
    .toBe(6);
  await page.keyboard.press("Escape");
  for (let index = 0; index < 6; index++) {
    await page
      .getByRole("button", {
        name: "업무 경계 정하기 편집 아이콘",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "복제", exact: true }).click();
  }
  const piece = await bounds(page.locator(".piece").nth(2));
  const swipeX = piece.x + 25;
  const swipeY = piece.y + 25;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: swipeX, y: swipeY }],
  });
  for (let offset = 20; offset <= 120; offset += 20) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: swipeX, y: swipeY - offset }],
    });
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() =>
      page.locator(".timeline-pane").evaluate((element) => element.scrollTop),
    )
    .toBeGreaterThan(0);
  await expect(page.locator(".piece.selected")).toHaveCount(0);
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("multiple planners retain independent plans, names and creation order", async ({
  page,
}) => {
  await createPlan(page);
  await page.getByRole("button", { name: "계획 제목과 설명 수정" }).click();
  await page
    .getByLabel("제목", { exact: true })
    .fill("첫 번째 플래너의 계획 A");
  await page.getByRole("button", { name: "적용", exact: true }).click();
  await page.getByRole("tab", { name: "Plan B", exact: true }).click();
  await page.getByRole("button", { name: "계획 제목과 설명 수정" }).click();
  await page
    .getByLabel("제목", { exact: true })
    .fill("첫 번째 플래너의 계획 B");
  await page.getByRole("button", { name: "적용", exact: true }).click();
  await page.getByRole("button", { name: "조각 추가", exact: true }).click();
  await page
    .getByLabel("제목", { exact: true })
    .fill("첫 플래너에만 있는 조각");
  await page.getByRole("button", { name: "적용", exact: true }).click();
  await page.getByRole("button", { name: "평가하기", exact: true }).click();
  await page.getByLabel("자원", { exact: true }).fill("9");
  await page.getByRole("button", { name: "평가 저장", exact: true }).click();
  await createPlan(page, 2);
  await expect(
    page.getByRole("heading", {
      name: "일을 이어가며 생활의 여유 만들기",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Plan B", exact: true }).click();
  await expect(page.locator(".timeline-row")).toHaveCount(6);
  await expect(page.locator(".rating-value").first()).toContainText("미평가");
  await page.getByRole("button", { name: "플래너 목록", exact: true }).click();
  const items = page
    .getByRole("list", { name: "저장한 플래너" })
    .getByRole("listitem");
  await expect(items).toHaveCount(2);
  await expect(items.first()).toContainText("나의 플래너 2");
  await page
    .getByRole("button", { name: "나의 플래너 1 이름 변경", exact: true })
    .click();
  await page.getByLabel("플래너 이름", { exact: true }).fill("이직과 생활");
  await page.getByRole("button", { name: "이름 저장", exact: true }).click();
  await page
    .getByRole("button", { name: "이직과 생활 열기", exact: true })
    .click();
  await expect(
    page.getByRole("tab", { name: "Plan A", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("heading", { name: "첫 번째 플래너의 계획 A", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Plan B", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "첫 번째 플래너의 계획 B", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".timeline-row")).toHaveCount(7);
  await expect(page.locator(".rating-value").first()).toContainText("9 / 10");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "내 플래너", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "나의 플래너 2 열기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "일을 이어가며 생활의 여유 만들기",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await login(page);
  await expect(items).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "이직과 생활 열기", exact: true }),
  ).toBeVisible();
});

test("deleting planners requires confirmation and handles an empty collection", async ({
  page,
}) => {
  await createPlan(page);
  await createPlan(page, 2);
  await page.getByRole("button", { name: "플래너 목록", exact: true }).click();
  await page
    .getByRole("button", { name: "나의 플래너 1 삭제", exact: true })
    .click();
  await page.getByRole("button", { name: "취소", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "나의 플래너 1 열기", exact: true }),
  ).toBeVisible();
  for (const name of ["나의 플래너 2", "나의 플래너 1"]) {
    await page
      .getByRole("button", { name: `${name} 삭제`, exact: true })
      .click();
    await page
      .getByRole("button", { name: "플래너 삭제", exact: true })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "아직 플래너가 없습니다", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) || "{}").planners.length,
        STORAGE,
      ),
    )
    .toBe(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "아직 플래너가 없습니다", exact: true }),
  ).toBeVisible();
  await createPlan(page, 3);
});

test("abandoned interviews and cancelled generation do not append planners", async ({
  page,
}) => {
  await createPlan(page);
  await page
    .getByRole("button", { name: "새 플래너 만들기", exact: true })
    .click();
  await page.getByRole("button", { name: "인터뷰 시작", exact: true }).click();
  await page.getByRole("button", { name: "내 플래너", exact: true }).click();
  await page.getByRole("button", { name: "계속하기", exact: true }).click();
  await expect(page.locator(".question")).toBeVisible();
  await page.getByRole("button", { name: "나가기", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "나가기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "내 플래너", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "새 플래너 만들기", exact: true })
    .click();
  await page.getByRole("button", { name: "인터뷰 시작", exact: true }).click();
  await answerInterview(page);
  await page.getByRole("button", { name: "플래너 생성", exact: true }).click();
  await page.getByRole("button", { name: "내 플래너", exact: true }).click();
  await page.waitForTimeout(1600);
  await expect(
    page.getByRole("list", { name: "저장한 플래너" }).getByRole("listitem"),
  ).toHaveCount(1);
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) || "{}").planners.length,
        STORAGE,
      ),
    )
    .toBe(1);
});

test("legacy storage stays untouched and is not imported", async ({ page }) => {
  const legacy = JSON.stringify({
    user: true,
    board: [{}, {}, {}],
    createdAt: "2026. 1. 1.",
  });
  await page.evaluate(
    (value) => localStorage.setItem("ople-prototype-v0", value),
    legacy,
  );
  await page.reload();
  await login(page);
  await expect(
    page.getByRole("heading", { name: "아직 플래너가 없습니다", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) || "{}").planners.length,
        STORAGE,
      ),
    )
    .toBe(0);
  expect(
    await page.evaluate(() => localStorage.getItem("ople-prototype-v0")),
  ).toBe(legacy);
});
