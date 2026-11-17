import { expect, test, type Page } from "@playwright/test";

function planner() {
  return {
    id: "p", name: "나의 계획", created_at: "2026-11-17T00:00:00Z",
    plans: ["현재 방향", "다른 방향", "원하는 삶"].map((kind) => ({
      kind, title: "계획 제목", description: "설명", scores: {}, pieces: [],
    })),
  };
}

async function api(page: Page, signedIn = true, saving?: Promise<void>) {
  let authenticated = signedIn;
  let stored = planner();
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/me") {
      await route.fulfill({ status: authenticated ? 200 : 401, json: authenticated ? { id: "u", name: "사용자", email: "hello@example.com" } : {} });
    } else if (path === "/api/auth/login" || path === "/api/auth/verify") {
      authenticated = true;
      await route.fulfill({ json: { id: "u", name: "사용자", email: "hello@example.com" } });
    } else if (path === "/api/auth/logout") {
      authenticated = false;
      await route.fulfill({ json: {} });
    } else if (path === "/api/planners/p" && route.request().method() === "PUT") {
      await saving;
      stored = { ...stored, ...route.request().postDataJSON() };
      await route.fulfill({ json: stored });
    } else if (path === "/api/planners") {
      await route.fulfill({ json: [stored] });
    } else if (path === "/api/generations") {
      await route.fulfill({ json: [] });
    } else if (path === "/api/interview/question") {
      await route.fulfill({ json: { question: "어떤 미래를 원하나요?" } });
    } else {
      await route.fulfill({ json: {} });
    }
  });
}

test("소개·목록·상세 직접 접속, 새로고침과 앞뒤 이동", async ({ page }) => {
  await api(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /하나의 정답 대신/ })).toBeVisible();
  await page.getByRole("button", { name: "내 플래너", exact: true }).click();
  await expect(page).toHaveURL(/\/planners$/);
  await page.getByRole("button", { name: "나의 계획", exact: true }).click();
  await expect(page).toHaveURL(/\/planners\/p$/);
  await expect(page.getByRole("heading", { name: "나의 계획", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "나의 계획", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/planners$/);
  await expect(page.getByRole("button", { name: "나의 계획", exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "나의 계획", exact: true })).toBeVisible();
});

test("보호 페이지는 루트에서 로그인하고 원래 상세로 복귀하지 않는다", async ({ page }) => {
  await api(page, false);
  await page.goto("/planners/p");
  await expect(page).toHaveURL("/");
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  await modal.getByLabel("이메일", { exact: true }).fill("hello@example.com");
  await modal.getByLabel("비밀번호").fill("password123");
  await modal.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(modal).not.toBeVisible();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: /하나의 정답 대신/ })).toBeVisible();
});

test("회원가입 코드 인증은 모달 내부에서 진행하고 루트에 머문다", async ({ page }) => {
  await api(page, false);
  await page.goto("/");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  const modal = page.getByRole("dialog");
  await modal.getByRole("button", { name: "이메일로 회원가입" }).click();
  await modal.getByLabel("이메일", { exact: true }).fill("hello@example.com");
  await modal.getByLabel("비밀번호").fill("password123");
  await modal.getByRole("button", { name: "인증번호 받기" }).click();
  await expect(page).toHaveURL("/");
  await modal.getByLabel("인증번호", { exact: true }).fill("123456");
  await modal.getByRole("button", { name: "인증하고 가입하기" }).click();
  await expect(modal).not.toBeVisible();
  await expect(page).toHaveURL("/");
});

test("없는 상세는 목록으로 이동하고 계정 모달 새로고침은 현재 경로 유지", async ({ page }) => {
  await api(page);
  await page.goto("/planners/missing");
  await expect(page).toHaveURL(/\/planners$/);
  await page.getByRole("button", { name: "계정", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL(/\/planners$/);
  await page.reload();
  await expect(page.getByRole("button", { name: "나의 계획", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("인터뷰 모달은 상태·방문 기록을 유지하고 뒤로가기 이탈을 취소할 수 있다", async ({ page }) => {
  await api(page);
  await page.goto("/planners");
  await page.getByRole("button", { name: "새 플래너 만들기" }).click();
  await expect(page).toHaveURL(/\/planners\/new$/);
  await page.getByRole("button", { name: "인터뷰 시작", exact: true }).click();
  await expect(page.getByRole("heading", { name: "어떤 미래를 원하나요?" })).toBeVisible();
  const historyLength = await page.evaluate(() => history.length);
  await page.getByRole("button", { name: "계정", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  await expect(page.getByRole("heading", { name: "어떤 미래를 원하나요?" })).toBeVisible();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.evaluate(() => history.back());
  await expect(page).toHaveURL(/\/planners\/new$/);
  await expect(page.getByRole("heading", { name: "어떤 미래를 원하나요?" })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.evaluate(() => history.back());
  await expect(page.getByRole("button", { name: "새 플래너 만들기" })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("button", { name: "인터뷰 시작", exact: true })).toBeVisible();
});

test("편집 저장 완료를 기다린 뒤 이동하고 새 상세에서도 편집을 유지한다", async ({ page }) => {
  let finish = () => {};
  const saving = new Promise<void>((resolve) => { finish = resolve; });
  await api(page, true, saving);
  await page.goto("/planners/p");
  await page.getByRole("button", { name: "플랜 수정" }).click();
  await page.getByLabel("제목", { exact: true }).fill("저장할 새 제목");
  const request = page.waitForRequest((request) => request.method() === "PUT");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await request;
  await page.getByRole("button", { name: "내 플래너", exact: true }).first().click();
  await expect(page).toHaveURL(/\/planners\/p$/);
  finish();
  await expect(page).toHaveURL(/\/planners$/);
  await page.getByRole("button", { name: "나의 계획", exact: true }).click();
  await expect(page.getByRole("heading", { name: "저장할 새 제목", exact: true })).toBeVisible();
});

test("로그아웃은 루트로 이동하며 로그인 모달을 다시 열지 않는다", async ({ page }) => {
  await api(page);
  await page.goto("/planners");
  await page.getByRole("button", { name: "계정", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "로그인", exact: true })).toBeEnabled();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("heading", { name: /하나의 정답 대신/ })).toBeVisible();
});

test("인터뷰 새로고침은 이탈 경고 후 경로를 유지하고 진행 상태를 초기화한다", async ({ page }) => {
  await api(page);
  await page.goto("/planners/new");
  await page.getByRole("button", { name: "인터뷰 시작", exact: true }).click();
  await expect(page.getByRole("heading", { name: "어떤 미래를 원하나요?" })).toBeVisible();
  const warning = page.waitForEvent("dialog");
  const reload = page.reload();
  const dialog = await warning;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.accept();
  await reload;
  await expect(page).toHaveURL(/\/planners\/new$/);
  await expect(page.getByRole("button", { name: "인터뷰 시작", exact: true })).toBeVisible();
});

test("녹음 중 계정 모달을 열어도 녹음기를 유지하고 이탈 취소 시 계속 녹음한다", async ({ page }) => {
  await api(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: {
      getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }),
    } });
    class Recorder {
      static isTypeSupported() { return true; }
      state = "inactive";
      mimeType = "audio/webm";
      start() { this.state = "recording"; }
      pause() { this.state = "paused"; }
      resume() { this.state = "recording"; }
      stop() { this.state = "inactive"; }
    }
    Object.defineProperty(window, "MediaRecorder", { value: Recorder });
  });
  await page.goto("/planners/new");
  await page.getByRole("button", { name: "인터뷰 시작", exact: true }).click();
  await page.getByRole("button", { name: "녹음 시작", exact: true }).click();
  await expect(page.getByRole("button", { name: "일시정지", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "계정", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "일시정지", exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "내 플래너", exact: true }).first().click();
  await expect(page).toHaveURL(/\/planners\/new$/);
  await expect(page.getByRole("button", { name: "일시정지", exact: true })).toBeVisible();
});

test("이전 목록의 생성 재시도 완료가 새 인터뷰를 중단하지 않는다", async ({ page }) => {
  await api(page);
  await page.route("**/api/generations", (route) => route.fulfill({ json: [{
    id: "job", status: "failed", planner_id: null, error: "생성 실패",
  }] }));
  let finish = () => {};
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  await page.route("**/api/generations/job/run", async (route) => {
    await pending;
    await route.fulfill({ json: { id: "job", status: "completed", planner_id: "p", error: null } });
  });
  await page.goto("/planners");
  const request = page.waitForRequest("**/api/generations/job/run");
  await page.getByRole("button", { name: "다시 시도", exact: true }).click();
  await request;
  await page.getByRole("button", { name: "새 플래너 만들기" }).click();
  await page.getByRole("button", { name: "인터뷰 시작", exact: true }).click();
  await expect(page.getByRole("heading", { name: "어떤 미래를 원하나요?" })).toBeVisible();
  const response = page.waitForResponse("**/api/generations/job/run");
  finish();
  await response;
  // Give any response-driven route transition a chance to commit.
  await page.getByRole("button", { name: "계정", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/planners\/new$/);
  await expect(page.getByRole("heading", { name: "어떤 미래를 원하나요?" })).toBeVisible();
});
