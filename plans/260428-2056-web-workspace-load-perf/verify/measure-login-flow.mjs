#!/usr/bin/env node
// Đo flow login → workspace dùng Playwright + CDP
// Usage: PLANE_USER=... PLANE_PASS=... node measure-login-flow.mjs [BASE_URL] [WORKSPACE_SLUG]
//
// Output: results/measurement-{timestamp}.md với metrics LCP/FCP/TTI/transfer/request-count
//
// Yêu cầu: npx playwright install chromium (chạy 1 lần)

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.argv[2] || "http://localhost";
const SLUG = process.argv[3] || "shinhan-bank-vn";
const USER = process.env.PLANE_USER;
const PASS = process.env.PLANE_PASS;

if (!USER || !PASS) {
  console.error("Cần env: PLANE_USER=... PLANE_PASS=...");
  process.exit(1);
}

const TS = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 15);
const OUT_DIR = path.join(__dirname, "results");
fs.mkdirSync(OUT_DIR, { recursive: true });
const OUT = path.join(OUT_DIR, `measurement-${TS}.md`);

const lines = [];
const log = (s) => {
  lines.push(s);
  console.log(s);
};

(async () => {
  log(`# Login flow measurement\n`);
  log(`- BASE_URL: ${BASE_URL}`);
  log(`- workspace: /${SLUG}/`);
  log(`- user: ${USER}`);
  log(`- timestamp: ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
  });
  const page = await ctx.newPage();

  // Track network
  const requests = [];
  page.on("response", async (resp) => {
    try {
      const req = resp.request();
      const headers = await resp.allHeaders();
      const sizes = await resp
        .body()
        .then((b) => b.length)
        .catch(() => 0);
      requests.push({
        url: req.url(),
        method: req.method(),
        status: resp.status(),
        type: req.resourceType(),
        encoding: headers["content-encoding"] || "",
        cache: headers["cache-control"] || "",
        size: sizes,
        timing: resp.timing(),
      });
    } catch {
      /* ignore */
    }
  });

  // ====== STEP 1: login page cold load ======
  log(`## 1. Cold load: ${BASE_URL}/`);
  const t0 = Date.now();
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 60000 });
  const loginLoadMs = Date.now() - t0;
  log(`- Total time: **${loginLoadMs} ms**`);

  // Find email input + submit
  log(`\n## 2. Submit credentials`);
  // Plane: 2-step (email → password)
  await page.locator('input[type="email"], input[name="email"]').first().fill(USER);
  await page.getByRole("button", { name: /continue|next|submit/i }).first().click();
  await page.locator('input[type="password"]').first().waitFor({ timeout: 10000 });
  await page.locator('input[type="password"]').first().fill(PASS);

  // Reset request counter để chỉ đo workspace flow
  requests.length = 0;
  const tLogin = Date.now();
  await Promise.all([
    page.waitForURL(/\/(workspaces|workspace|[^/]+)\/?$/, { timeout: 30000 }).catch(() => {}),
    page.getByRole("button", { name: /sign|log|submit|continue/i }).first().click(),
  ]);

  // Đợi tới workspace cụ thể (nếu redirect tới home, navigate tay)
  if (!page.url().includes(`/${SLUG}/`)) {
    await page.goto(`${BASE_URL}/${SLUG}/`, { waitUntil: "networkidle", timeout: 60000 });
  } else {
    await page.waitForLoadState("networkidle", { timeout: 60000 });
  }
  const workspaceLoadMs = Date.now() - tLogin;
  log(`- Login → /${SLUG}/ networkidle: **${workspaceLoadMs} ms**`);

  // ====== STEP 3: Web vitals ======
  log(`\n## 3. Web Vitals (workspace page)`);
  const vitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      const out = {};
      const observer = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.entryType === "largest-contentful-paint") out.lcp = Math.round(e.startTime);
          if (e.entryType === "paint" && e.name === "first-contentful-paint")
            out.fcp = Math.round(e.startTime);
        }
      });
      try {
        observer.observe({ type: "largest-contentful-paint", buffered: true });
        observer.observe({ type: "paint", buffered: true });
      } catch {
        /* ignore */
      }
      const nav = performance.getEntriesByType("navigation")[0];
      if (nav) {
        out.ttfb = Math.round(nav.responseStart);
        out.domContentLoaded = Math.round(nav.domContentLoadedEventEnd);
        out.loadEvent = Math.round(nav.loadEventEnd);
      }
      setTimeout(() => resolve(out), 1500);
    });
  });
  log(`- TTFB: ${vitals.ttfb ?? "?"} ms`);
  log(`- FCP: ${vitals.fcp ?? "?"} ms`);
  log(`- LCP: ${vitals.lcp ?? "?"} ms`);
  log(`- DOMContentLoaded: ${vitals.domContentLoaded ?? "?"} ms`);
  log(`- Load event: ${vitals.loadEvent ?? "?"} ms`);

  // ====== STEP 4: Network analysis ======
  log(`\n## 4. Network (workspace flow only)`);
  const totalBytes = requests.reduce((s, r) => s + r.size, 0);
  const jsReqs = requests.filter((r) => r.type === "script");
  const apiReqs = requests.filter((r) => /\/api\/|\/auth\//.test(r.url));
  const fontReqs = requests.filter((r) => r.type === "font");
  const imgReqs = requests.filter((r) => r.type === "image");

  log(`- Total requests: **${requests.length}**`);
  log(`- Total transfer: **${(totalBytes / 1024).toFixed(1)} KB**`);
  log(`- Scripts: ${jsReqs.length} (${(jsReqs.reduce((s, r) => s + r.size, 0) / 1024).toFixed(1)} KB)`);
  log(`- API/Auth: ${apiReqs.length}`);
  log(`- Fonts: ${fontReqs.length} (${(fontReqs.reduce((s, r) => s + r.size, 0) / 1024).toFixed(1)} KB)`);
  log(`- Images: ${imgReqs.length} (${(imgReqs.reduce((s, r) => s + r.size, 0) / 1024).toFixed(1)} KB)`);

  log(`\n### Top 10 largest responses`);
  log(`| Size (KB) | Type | Encoding | Cache | URL |`);
  log(`|----------:|------|----------|-------|-----|`);
  requests
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .forEach((r) => {
      log(
        `| ${(r.size / 1024).toFixed(1)} | ${r.type} | ${r.encoding || "-"} | ${(r.cache || "-").slice(0, 30)} | ${r.url.slice(-90)} |`
      );
    });

  log(`\n### API calls (workspace bootstrap)`);
  log(`| Status | Time (ms) | URL |`);
  log(`|-------:|----------:|-----|`);
  apiReqs.forEach((r) => {
    const tot = r.timing?.responseEnd ? Math.round(r.timing.responseEnd) : "?";
    log(`| ${r.status} | ${tot} | ${r.url.slice(-100)} |`);
  });

  await browser.close();
  fs.writeFileSync(OUT, lines.join("\n"));
  console.log(`\nReport saved: ${OUT}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
