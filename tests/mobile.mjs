import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
const dir = mkdtempSync(`${tmpdir()}/wedding-ui-`);
const origin = "http://localhost:3102";
const password = "isolated-ui-test-password";
const server = spawn(process.execPath, ["server.js"], {
  env: {
    ...process.env,
    NODE_ENV: "development",
    PORT: "3102",
    PUBLIC_ORIGIN: origin,
    DATA_DIR: dir,
    ADMIN_PASSWORD: password,
    MUSIC_URL: "/media/test.wav",
  },
});
let browser;
try {
  await new Promise((resolve, reject) => {
    server.stdout.once("data", resolve);
    server.once("error", reject);
    server.once("exit", (code) => reject(Error(`Server exited: ${code}`)));
  });
  mkdirSync("test-results", { recursive: true });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  // Tiny valid PCM audio fixture, served only inside this test.
  const wav = Buffer.alloc(8044);
  wav.write("RIFF");
  wav.writeUInt32LE(8036, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(8000, 40);
  await context.route("**/media/test.wav", (route) =>
    route.fulfill({ contentType: "audio/wav", body: wav }),
  );
  await context.route("https://www.google.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<p>Map external service excluded from local tests</p>",
    }),
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin);
  await page.waitForFunction(() =>
    document.querySelector("audio").getAttribute("src"),
  );
  assert.equal(await page.locator("audio").evaluate((a) => a.paused), true);
  await page.screenshot({ path: "test-results/mobile-cover.png" });
  await page.getByRole("button", { name: "Mở thiệp" }).click();
  await page.waitForFunction(() => !document.querySelector("audio").paused);
  await page.getByRole("button", { name: "Tắt nhạc", exact: true }).click();
  assert.equal(await page.locator("audio").evaluate((a) => a.paused), true);
  await page.screenshot({
    path: "test-results/mobile-invitation.png",
    fullPage: true,
    animations: "disabled",
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `overflow at ${width}`,
    );
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "overflow at 200% text",
  );
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator("#party")
    .screenshot({
      path: "test-results/mobile-party.png",
      animations: "disabled",
    });
  await page
    .locator(".schedule")
    .screenshot({
      path: "test-results/mobile-schedule.png",
      animations: "disabled",
    });
  assert.equal(await page.locator(".wedding-day").textContent(), "18");
  await page.locator('#party a[href="#rsvp"]').click();
  await page.locator("#photos button").first().click();
  assert.equal(await page.locator("#lightbox").isVisible(), true);
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator("#photo-count").textContent(), "2 / 3");
  await page.keyboard.press("Escape");
  await page.locator("#rsvp-form input[name=name]").fill("Kiểm tra mobile");
  await page.locator("#rsvp-form input[name=guests]").fill("2");
  await page.route("**/api/rsvp", (route) => route.abort());
  await page.locator("#rsvp-form button").click();
  await page.locator("#rsvp-form .feedback.error").waitFor();
  assert.equal(
    await page.locator("#rsvp-form input[name=name]").inputValue(),
    "Kiểm tra mobile",
  );
  assert.equal(
    await page.locator("#rsvp-form .feedback").textContent(),
    "Chưa gửi được do mất kết nối. Vui lòng thử lại.",
  );
  await page.unroute("**/api/rsvp");
  await page.locator("#rsvp-form button").click();
  await page
    .locator("#rsvp-form .feedback")
    .filter({ hasText: "Đã lưu" })
    .waitFor();
  for (const status of ["no", "maybe"]) {
    await page.locator("#rsvp-form input[name=name]").fill(`Tham dự ${status}`);
    await page.locator(`#rsvp-form input[value=${status}]`).check();
    assert.equal(
      await page.locator("#rsvp-form input[name=guests]").inputValue(),
      status === "no" ? "0" : "1",
    );
    await page.locator("#rsvp-form button").click();
    await page
      .locator("#rsvp-form .feedback")
      .filter({ hasText: "Đã lưu" })
      .waitFor();
  }
  await page.locator("#wish-form input[name=name]").fill("Khách <script>");
  await page
    .locator("#wish-form textarea")
    .fill("<img src=x onerror=alert(1)> Chúc hạnh phúc!");
  await page.locator("#wish-form button").click();
  await page
    .locator("#wish-form .feedback")
    .filter({ hasText: "Đã lưu" })
    .waitFor();
  assert.equal(
    await page
      .locator("#wishes")
      .getByText("Khách <script>", { exact: true })
      .count(),
    0,
  );
  const admin = await browser.newContext();
  const manager = await admin.newPage();
  await manager.goto(origin + "/admin.html");
  await manager.locator("input[name=password]").fill(password);
  await manager.getByRole("button", { name: "Đăng nhập" }).click();
  await manager.locator("#rows").getByText("Kiểm tra mobile").waitFor();
  assert.equal(await manager.locator("#rows tr").count(), 3);
  const exportResponse = await admin.request.get(origin + "/api/admin/export");
  assert.equal(exportResponse.status(), 200);
  assert.match(await exportResponse.text(), /Kiểm tra mobile/);
  await manager.getByRole("button", { name: "Duyệt lời chúc" }).click();
  await manager.getByRole("button", { name: "Ẩn lời chúc" }).waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Mở thiệp" }).click();
  await page
    .locator("#wishes")
    .getByText("Khách <script>", { exact: true })
    .waitFor();
  assert.equal(await page.locator("#wishes img, #wishes script").count(), 0);
  assert.equal(await page.locator("#wishes time").count(), 1);
  await manager.getByRole("button", { name: "Ẩn lời chúc" }).click();
  await manager.getByRole("button", { name: "Duyệt lời chúc" }).waitFor();
  await page.reload();
  assert.equal(
    await page
      .locator("#wishes")
      .getByText("Khách <script>", { exact: true })
      .count(),
    0,
  );
  await manager.getByRole("button", { name: "Đăng xuất" }).click();
  await manager.getByRole("button", { name: "Đăng nhập" }).waitFor();
  assert.equal((await admin.request.get(origin + "/api/admin")).status(), 401);
  // Real-photo layout and broken-image fallback, with no use of demo couple photos.
  await page.route("**/photos.json", (route) =>
    route.fulfill({
      json: [
        { label: "Ảnh thay thế", src: "/photos/test.svg" },
        { label: "Ảnh chưa tải được", src: "/photos/missing.webp" },
      ],
    }),
  );
  await page.route("**/photos/test.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#f9eaf0"/></svg>',
    }),
  );
  await page.reload();
  await page.getByRole("button", { name: "Mở thiệp" }).click();
  await page.locator(".hero-photo img").waitFor();
  assert.equal(
    await page
      .locator(".hero-photo img")
      .evaluate((img) => img.clientWidth <= img.parentElement.clientWidth),
    true,
  );
  await page.locator("#photos button").nth(1).locator(".photo").waitFor();
  const metadata = await (await fetch(origin + "/index.html")).text();
  assert.match(metadata, new RegExp(`${origin}/share.png`));
  assert.equal((await fetch(origin + "/share.png")).status, 200);
  const calendar = await (await fetch(origin + "/wedding.ics")).text();
  assert.match(calendar, /DTSTART:20261018T030000Z/);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: responsive/200% text, music gesture, album, real-photo fallback, offline errors, all RSVP states, cross-device moderation, CSV, logout, share metadata and calendar.",
  );
} finally {
  await browser?.close();
  if (server.exitCode === null)
    await new Promise((resolve) => {
      server.once("exit", resolve);
      server.kill();
    });
  rmSync(dir, { recursive: true, force: true });
}
