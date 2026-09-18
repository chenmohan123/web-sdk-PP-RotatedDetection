import { chromium } from "playwright";
import { createServer, preview } from "vite";
import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const root = process.cwd(),
  evidence = path.join(root, ".tmp/task2-ui");
await mkdir(evidence, { recursive: true });
const local = await createServer({
  configFile: path.join(root, "demo/vite.config.ts"),
  mode: "dev-local",
});
await local.listen();
const production = await preview({
  configFile: path.join(root, "demo/vite.config.ts"),
});
const browser = await chromium.launch({ channel: "chromium", headless: true });
const errors = [],
  checks = [];
const vanillaOnly = process.argv.includes("--vanilla-only");
const vanilla = await createServer({
  configFile: path.join(root, "demo/vite.config.ts"),
  mode: "vanilla-local",
  server: { port: 4193 },
});
await vanilla.listen();
try {
  for (const width of vanillaOnly ? [] : [1280, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      acceptDownloads: true,
    });
    page.on("pageerror", (error) => errors.push(error.message));
    let modelRequests = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/local-model/model.onnx")) modelRequests++;
    });
    await page.goto("http://127.0.0.1:4192/");
    assert.equal(await page.locator("html").getAttribute("lang"), "zh-CN");
    assert.equal(await page.locator("select").inputValue(), "modelscope");
    await page
      .locator("input[type=file]")
      .setInputFiles(path.join(root, ".tmp/evaluation/images/P0861.png"));
    await page.waitForFunction(
      () => document.querySelector("canvas")?.width > 0,
    );
    if (width === 390)
      await page.getByRole("button", { name: "CPU", exact: true }).click();
    await page.getByRole("button", { name: "开始检测", exact: true }).click();
    await page
      .locator("[role=status][data-state=success]")
      .waitFor({ timeout: 120000 });
    const count = await page.locator(".result-row").count();
    assert(count > 0);
    assert.equal(modelRequests, 1);
    await page.getByRole("button", { name: "开始检测", exact: true }).click();
    await page
      .locator("[role=status][data-state=success]")
      .waitFor({ timeout: 120000 });
    assert.equal(modelRequests, 1, "第二次加载应从校验通过的缓存读取");
    const geometry = () => {
      const r = document.querySelector("canvas").getBoundingClientRect();
      return {
        x: r.x + scrollX,
        y: r.y + scrollY,
        width: r.width,
        height: r.height,
      };
    };
    const before = await page.evaluate(geometry);
    await page.locator(".result-row").first().click();
    assert.equal(
      await page.locator(".result-row").first().getAttribute("aria-pressed"),
      "true",
    );
    assert.deepEqual(
      await page.evaluate(geometry),
      before,
      "选中目标不能推动图片",
    );
    await page.getByRole("button", { name: "English", exact: true }).click();
    assert.equal(
      await page.locator(".result-row").first().getAttribute("aria-pressed"),
      "true",
    );
    assert.deepEqual(await page.evaluate(geometry), before);
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export JSON", exact: true })
      .click();
    const jsonFile = path.join(evidence, `result-${width}.json`);
    await (await download).saveAs(jsonFile);
    const result = JSON.parse(await readFile(jsonFile, "utf8"));
    assert.equal(result.detections.length, count);
    assert.equal(
      result.runtime.actualBackend,
      width === 1280 ? "webgpu" : "wasm",
    );
    const png = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export overlay", exact: true })
      .click();
    await (await png).saveAs(path.join(evidence, `overlay-${width}.png`));
    await page.screenshot({
      path: path.join(evidence, `result-${width}-en.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "中文", exact: true }).click();
    await page.screenshot({
      path: path.join(evidence, `result-${width}-zh.png`),
      fullPage: true,
    });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.getByText("缓存管理", { exact: true }).click();
    await page.locator('[data-sdk-cache-clear="current"]').click();
    await page.waitForFunction(
      () =>
        document.querySelector("[data-sdk-cache-usage]")?.textContent ===
        "0.00 MB",
    );
    await page.locator('[data-sdk-cache-clear="all"]').click();
    await page.getByRole("button", { name: "重置", exact: true }).click();
    assert.equal(await page.locator("canvas").count(), 0);
    const imageBytes = Array.from(
      await readFile(path.join(root, ".tmp/evaluation/images/P0861.png")),
    );
    const dropped = await page.evaluateHandle((bytes) => {
      const data = new DataTransfer();
      data.items.add(
        new File([new Uint8Array(bytes)], "dropped.png", { type: "image/png" }),
      );
      return data;
    }, imageBytes);
    await page
      .locator(".canvas-wrap")
      .dispatchEvent("drop", { dataTransfer: dropped });
    await dropped.dispose();
    await page.waitForFunction(
      () => document.querySelector("canvas")?.width > 0,
    );
    await page.getByRole("button", { name: "开始检测", exact: true }).click();
    await page.getByRole("button", { name: "取消", exact: true }).click();
    await page
      .getByRole("button", { name: "开始检测", exact: true })
      .waitFor({ timeout: 30000 });
    assert.equal(await page.locator(".result-row").count(), 0);
    await page.getByRole("button", { name: "重置", exact: true }).click();
    await page.locator("input[type=file]").setInputFiles({
      name: "bad.png",
      mimeType: "image/png",
      buffer: Buffer.from([1, 2, 3]),
    });
    await page.getByRole("alert").waitFor();
    assert(
      await page
        .getByRole("button", { name: "开始检测", exact: true })
        .isDisabled(),
    );
    checks.push({
      width,
      count,
      backend: result.runtime.actualBackend,
      language: true,
      stableSelection: true,
      cacheHit: true,
      dragDrop: true,
      cancel: true,
      json: true,
      png: true,
      cache: true,
      invalidInput: true,
      overflow: false,
    });
    await page.close();
  }
  const plain = await browser.newPage();
  plain.on("pageerror", (error) => errors.push(error.message));
  await plain.goto("http://127.0.0.1:4193/");
  await plain
    .locator("input[type=file]")
    .setInputFiles(path.join(root, ".tmp/evaluation/images/P0861.png"));
  await plain.getByRole("button", { name: "开始检测", exact: true }).click();
  await plain.waitForFunction(
    () =>
      document.querySelector("#result")?.textContent?.includes('"detections"'),
    { timeout: 120000 },
  );
  const plainResult = JSON.parse(await plain.locator("#result").textContent());
  assert.equal(plainResult.runtime.actualBackend, "wasm");
  assert.equal(plainResult.detections.length, 136);
  await plain.close();
  const prod = await browser.newPage();
  prod.on("pageerror", (error) => errors.push(error.message));
  await prod.goto("http://127.0.0.1:4194/");
  await prod.getByText("模型来源尚未发布", { exact: true }).waitFor();
  await prod
    .locator("input[type=file]")
    .setInputFiles(path.join(root, ".tmp/evaluation/images/P0861.png"));
  await prod.waitForFunction(() => document.querySelector("canvas")?.width > 0);
  assert(
    await prod
      .getByRole("button", { name: "开始检测", exact: true })
      .isDisabled(),
  );
  await prod.locator("select").selectOption("huggingface");
  assert(
    await prod
      .getByRole("button", { name: "开始检测", exact: true })
      .isDisabled(),
  );
  await prod.screenshot({
    path: path.join(evidence, "production-unpublished.png"),
    fullPage: true,
  });
  const assets = await readdir(path.join(root, "demo-dist/assets"));
  for (const name of assets.filter((n) => n.endsWith(".js")))
    assert(
      !(
        await readFile(path.join(root, "demo-dist/assets", name), "utf8")
      ).includes("local-model/model.onnx"),
    );
  assert.deepEqual(errors, []);
  const report = {
    date: new Date().toISOString(),
    browser: browser.version(),
    checks,
    productionUnpublished: true,
    productionLocalUrlAbsent: true,
    vanilla: {
      backend: plainResult.runtime.actualBackend,
      count: plainResult.detections.length,
    },
    errors,
  };
  await writeFile(
    path.join(evidence, vanillaOnly ? "vanilla.json" : "browser.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await local.close();
  await vanilla.close();
  production.httpServer.close();
}
