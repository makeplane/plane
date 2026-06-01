// Capture screenshots of the Help Center reader UX improvements (header,
// search, full-width images, TOC, error/empty states, locale fallback).
//
//   cd apps/api && python manage.py make_help_session   # -> SHOT_COOKIE
//   SHOT_COOKIE=<key> PHASE=vi node capture-ux.mjs       # VI UI scenarios
//   SHOT_COOKIE=<key> PHASE=en node capture-ux.mjs       # EN UI fallback shot
//
// The UI locale follows the signed-in user's profile.language, so the caller
// sets that per phase (see the orchestration in the task). Output: ./out-ux/*.png

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://localhost:3000";
const API = process.env.API_URL || "http://localhost:8000";
const COOKIE = process.env.SHOT_COOKIE;
const PHASE = process.env.PHASE || "vi";
const ARTICLE = process.env.ARTICLE_SLUG || "head-office-dashboard";
const SEARCH = process.env.SEARCH || "cycles";
const FALLBACK_SEARCH = process.env.FALLBACK_SEARCH || "cham cong";
const OUT = join(here, "out-ux");

if (!COOKIE) {
  console.error("Missing SHOT_COOKIE. Run: cd apps/api && python manage.py make_help_session");
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "light",
  ignoreHTTPSErrors: true,
});
await context.addCookies([
  { name: "session-id", value: COOKIE, url: BASE },
  { name: "session-id", value: COOKIE, url: API },
]);

const page = await context.newPage();
await page.goto(`${BASE}/help`, { waitUntil: "domcontentloaded", timeout: 30000 });
const meStatus = await page.evaluate(async () => {
  try {
    return (await fetch("/api/users/me/", { credentials: "include" })).status;
  } catch {
    return 0;
  }
});
console.log("browser /api/users/me/ ->", meStatus, "| phase:", PHASE);
if (meStatus !== 200) {
  console.error("Browser NOT authenticated — aborting.");
  await browser.close();
  process.exit(2);
}

const shot = async (name) => {
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log("OK  ", name);
};
const open = async (path, wait = 3500) => {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(wait);
};

if (PHASE === "en") {
  // EN UI searching a Vietnamese term: UI locale has no match -> source (vi)
  // fallback, showing the fallback banner + per-row VI badges.
  await open(`/help?q=${encodeURIComponent(FALLBACK_SEARCH)}`);
  await shot("help-07-search-fallback-en");
} else {
  // 1) Home: brand header + signed-in user menu + featured (not duplicated) + grid
  await open("/help");
  await shot("help-01-home");

  // 2) Search results: count heading + category badges + snippets
  await open(`/help?q=${encodeURIComponent(SEARCH)}`);
  await shot("help-02-search-results");

  // 3) No-results: illustration + hint + "browse all categories" CTA
  await open("/help?q=zzzqwxyz123");
  await shot("help-03-search-no-results");

  // 4) Article (desktop): full-width screenshots, big H1, sticky TOC, header search, breadcrumb
  await open(`/help/a/${ARTICLE}`);
  await shot("help-04-article-desktop");

  // 5) Click image -> full-screen zoom viewer
  const img = await page.$("img.read-only-image");
  if (img) {
    await img.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await shot("help-05-image-zoom");
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(500);
  } else {
    console.log("WARN no content image found for zoom shot");
  }

  // 6) Article (mobile 390px): collapsible "On this page" TOC, collapsed header
  await page.setViewportSize({ width: 390, height: 844 });
  await open(`/help/a/${ARTICLE}`);
  await page.click("details > summary", { timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(600);
  await shot("help-06-article-mobile");
}

await browser.close();
console.log(`\nDone -> ${OUT}`);
