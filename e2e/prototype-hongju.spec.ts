import { expect, test } from "@playwright/test";

test.skip(
  !process.env.PROTOTYPE_HTML_DIR,
  "Standalone HTML suite; use prototype-hongju.config.ts",
);

test("interview, compare, edit, assess, restore and reset", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "내 미래 펼쳐보기" }).click();
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "눌러서 이야기하기" }).click();
    await page
      .getByLabel("나의 답변")
      .fill(`나의 이야기 ${i + 1}: 창작과 가족이 있는 삶`);
    await page.getByRole("button", { name: "이 답변으로 계속" }).click();
  }
  await expect(page.getByLabel("중요한 가치")).toHaveValue(/나의 이야기 1/);
  await page.getByLabel("중요한 가치").fill("여유와 창작");
  await page.getByRole("button", { name: "세 가지 미래 만들기" }).click();
  await expect(
    page.getByRole("heading", { name: "내 앞에 펼쳐진 세 갈래" }),
  ).toBeVisible();
  await expect(page.getByText("여유와 창작", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Plan 2 살펴보기" }).click();
  await page.getByRole("button", { name: "이 계획 다듬기" }).click();
  await page.getByRole("button", { name: "조각 추가" }).click();
  await page.getByLabel("조각 제목").fill("내 작은 작업실");
  await page.getByLabel("시작 연차").selectOption("2");
  await page.getByLabel("기간").selectOption("2");
  await page.getByRole("button", { name: "조각 저장" }).click();
  await page
    .getByRole("button", { name: "내 작은 작업실", exact: true })
    .click();
  await expect(page.getByLabel("시작 연차")).toHaveValue("2");
  await expect(page.getByLabel("기간")).toHaveValue("2");
  await page.getByRole("button", { name: "복제", exact: true }).click();
  await page
    .getByRole("button", { name: "내 작은 작업실 (복사)", exact: true })
    .click();
  await page.getByRole("button", { name: "삭제", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "내 작은 작업실 (복사)", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "내 작은 작업실", exact: true })
    .click();
  await page.getByLabel("조각 메모").fill("매주 한 번, 나만의 시간");
  await page.getByRole("button", { name: "조각 저장" }).click();
  await page.getByLabel("호감 점수").fill("8");
  await page.getByRole("button", { name: "확대" }).click();
  await expect(page.getByTestId("timeline")).toHaveAttribute("data-zoom", "2");
  const minimap = page.getByRole("button", {
    name: "타임라인 미니맵: 누른 위치로 이동",
  });
  await minimap.click({ position: { x: 280, y: 15 } });
  await expect
    .poll(() =>
      page.locator("#timeline-scroll").evaluate((el) => el.scrollLeft),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "보드 완성하기" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "내 삶의 다음 페이지" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "계속 다듬기" }).click();
  await expect(
    page.getByRole("button", { name: "내 작은 작업실", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("호감 점수")).toHaveValue("8");
  await page.getByRole("button", { name: "세 계획 보기" }).click();
  await page.getByRole("button", { name: "Plan 1 살펴보기" }).click();
  await page.getByRole("button", { name: "이 계획 다듬기" }).click();
  await expect(
    page.getByRole("button", { name: "내 작은 작업실", exact: true }),
  ).toHaveCount(0);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "데모 초기화" }).click();
  await expect(
    page.getByRole("button", { name: "내 미래 펼쳐보기" }),
  ).toBeVisible();
});

test("mobile layout and bounded timeline editing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "완성된 예시 먼저 보기" }).click();
  await page.getByRole("button", { name: "이 계획 다듬기" }).click();
  await page.getByRole("button", { name: "조각 추가" }).click();
  await page.getByLabel("조각 제목").fill("마지막 해의 쉼");
  await page.getByLabel("시작 연차").selectOption("5");
  await page.getByRole("button", { name: "조각 저장" }).click();
  await page
    .getByRole("button", { name: "마지막 해의 쉼", exact: true })
    .click();
  await expect(page.getByLabel("기간")).toHaveValue("1");
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
