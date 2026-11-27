// playwright-cli run-code --filename=prototype/browser-check.cjs (isolated session)
async (page) => {
  const expect = (v, why) => {
    if (!v) throw Error(why);
  };
  await page.goto("http://localhost:4178");
  await page.getByRole("button", { name: "첫 번째 플랜 펼치기" }).click();
  await page.locator("#pen").click();
  const box = await page.locator(".sheet").boundingBox();
  await page.mouse.move(box.x + 60, box.y + 70);
  await page.mouse.down();
  await page.mouse.move(box.x + 85, box.y + 75, { steps: 5 });
  await page.mouse.up();
  expect(
    (await page.locator(".hand [data-ink]").count()) === 1,
    "stroke missing",
  );
  await page.reload();
  await page.locator('[data-open="0"]').click();
  expect(
    (await page.locator(".hand [data-ink]").count()) === 1,
    "stroke not persisted",
  );
  await page.locator("#png").click();
  expect(
    (await page.locator(".preview .hand [data-ink]").count()) === 1,
    "preview lost stroke",
  );
  await page.locator("#download").click();
  await page.locator("dialog").waitFor({ state: "hidden" });
  await page.locator("#all").click();
  await page.locator("#start").click();
  await page.locator("#field").fill("notebook-test@example.com");
  await page.locator("#field").press("Enter");
  await page.locator("#field").fill("12345");
  await page.locator("#field").press("Enter");
  expect(await page.locator("dialog").isVisible(), "short code accepted");
  await page.locator("#field").fill("123456");
  await page.locator("#field").press("Enter");
  expect(
    (await page.locator("#count").innerText()) === "1 / 10",
    "interview did not start",
  );
  await page.locator("#leave").click();
  await page.locator('[data-book="0"]').click();
  expect(
    (await page.locator("#count").innerText()) === "1 / 10",
    "interview not resumable",
  );
}
