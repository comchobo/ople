// Start Ople locally first. Run with playwright-core and a Chromium executable.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium } = require("playwright-core");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM || "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  try {
    const page = await browser.newPage({
        viewport: { width: 1024, height: 900 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const dir = process.env.CAPTURES;
    async function shot(name) {
      if (dir) {
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: `${dir}/${name}.png` });
      }
    }
    await page.goto("http://127.0.0.1:8765/PROTOTYPE.html");
    await shot("tablet");
    await page.setViewportSize({ width: 390, height: 844 });
    await shot("mobile");
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth === innerWidth,
      ),
    );
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.locator('[data-sample="0"]').click();
    await shot("editor");
    const fixture = await page.evaluate(() => structuredClone(demo));
    assert(await page.evaluate((d) => validateDraft(d), fixture));
    assert(
      !(await page.evaluate(
        (d) => validateDraft({ ...d, plans: [d.plans[0]] }),
        fixture,
      )),
    );
    await page.locator("#back").click();
    await page.locator("#start").click();
    await page.locator("#email").fill("paper@example.com");
    await page.locator("#auth button").click();
    await page.locator("#code").fill("3");
    await page.locator("#codeform button").click();
    let answers = 0,
      questions = 0,
      attempts = 0;
    // Repeatable contract test: actual MediaRecorder, canned provider responses only at HTTP boundary.
    await page.route("**/.env.dev", (r) =>
      r.fulfill({
        body: "OPLE_LOCAL_RELAY=1\nCLOUDFLARE_STT_MODEL=@cf/openai/whisper-large-v3-turbo\nOLLAMA_MODEL=test",
      }),
    );
    await page.route("**/voice/audio", (r) => {
      const b = r.request().postDataJSON();
      assert(b.audio.length > 50);
      assert.equal(b.language, "ko");
      attempts++;
      if (attempts > 1) answers++;
      return r.fulfill({
        json: {
          result: { text: attempts === 1 ? "" : "공방에서 일하고 싶어요." },
        },
      });
    });
    await page.route("**/voice/chat", (r) => {
      const b = r.request().postDataJSON();
      assert.equal(b.stream, false);
      const n = JSON.parse(b.messages[1].content).interview.length;
      assert.equal(n, answers);
      if (n < 10) questions++;
      return r.fulfill({
        json: {
          message: {
            content:
              n === 10
                ? JSON.stringify(fixture)
                : `${n + 1}번째 삶의 이야기를 들려줄래요?`,
          },
        },
      });
    });
    await page.locator("#begin").click();
    for (let n = 0; n < 11; n++) {
      await page.getByRole("button", { name: "답변 녹음" }).click();
      await page.getByRole("button", { name: "답변 마치기" }).waitFor();
      await page.waitForTimeout(350);
      await page.locator("#speak").click();
    }
    await page.locator("#canvas").waitFor();
    assert.equal(questions, 10);
    assert.equal(answers, 10);
    // Chromium sends native pen PointerEvents with different pressures and pointer capture.
    const cdp = await page.context().newCDPSession(page),
      rect = await page.locator("canvas").boundingBox();
    async function pen(type, x, y, force) {
      await cdp.send("Input.dispatchMouseEvent", {
        type,
        x: rect.x + (x * rect.width) / 760,
        y: rect.y + (y * rect.height) / 1010,
        pointerType: "pen",
        button: type === "mouseMoved" ? "none" : "left",
        buttons: type === "mouseReleased" ? 0 : 1,
        force,
      });
    }
    await pen("mousePressed", 210, 200, 0.1);
    await pen("mouseMoved", 235, 200, 0.8);
    await pen("mouseReleased", 235, 200, 0);
    const points = await page.evaluate(() => current.plans[0].ink[0].p);
    assert(points.at(-1)[2] > points[0][2]);
    await page.locator('[data-tool="erase"]').click();
    await pen("mousePressed", 224, 200, 0.5);
    await pen("mouseReleased", 224, 200, 0);
    assert.equal(await page.evaluate(() => current.plans[0].ink.length), 0);
    await page.locator("#undo").click();
    const [x, y] = await page.evaluate(() => sceneInk[0].p[0]);
    await pen("mousePressed", x, y, 0.4);
    await pen("mouseReleased", x, y, 0);
    assert.equal(await page.evaluate(() => current.plans[0].gone.length), 1);
    await page.locator("#rate0").selectOption("0");
    await page.locator('[data-tab="2"]').click();
    assert.equal(await page.locator("#rate0").inputValue(), "");
    await page.reload();
    await page.locator("#lib").click();
    await page.locator(".row").click();
    assert.equal(await page.locator("#rate0").inputValue(), "0");
    assert.deepEqual(
      await page.evaluate(() => [
        current.qa.length,
        current.plans[0].ink.length,
        current.plans[0].gone.length,
      ]),
      [10, 1, 1],
    );
    const dl = page.waitForEvent("download");
    await page.locator("#export").click();
    const file = await (await dl).path(),
      png = await fs.readFile(file);
    assert.equal(png.readUInt32BE(16), 1520);
    assert.equal(png.readUInt32BE(20), 2020);
    const expected = await page
      .locator("canvas")
      .evaluate((c) => c.toDataURL().split(",")[1]);
    assert(
      png.equals(Buffer.from(expected, "base64")),
      "Export differs from the visible canvas",
    );
    await page.locator("#home").click();
    await page.locator('[data-sample="0"]').click();
    await page.locator("#rate1").selectOption("4");
    await page.locator("#logout").click();
    await page.locator('[data-sample="0"]').click();
    assert.equal(await page.locator("#rate1").inputValue(), "");
    await page.locator("#login").click();
    await page.locator("#email").fill("other@example.com");
    await page.locator("#auth button").click();
    await page.locator("#code").fill("7");
    await page.locator("#codeform button").click();
    assert.equal(await page.locator(".row").count(), 0);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: responsive layout, ten-turn recording flow, empty transcript retry, pen pressure, stroke erase/undo, draft stroke erase, independent plans, reload, PNG pixels and email isolation",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
