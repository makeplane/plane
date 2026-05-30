// Capture Help Center screenshots against a running Shinhan Workspace instance.
//
// Auth is by injected session cookie (no SSO login form): get the cookie from
//   cd apps/api && python manage.py make_help_session
// then run:
//   SHOT_COOKIE=<key> node capture.mjs
//
// Reads targets.json (name + route template). {ws}/{pid}/{uid} are resolved at
// runtime from the API using the same session cookie. Output: ./out/<name>.png
// (consumed by `python manage.py inject_help_screenshots`).

import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://localhost:3000";
const API = process.env.API_URL || "http://localhost:8000";
const COOKIE = process.env.SHOT_COOKIE;
const WS = process.env.WS_SLUG || "help-demo";
const THEME = process.env.THEME || "light";
const OUT = join(here, "out");

if (!COOKIE) {
  console.error("Missing SHOT_COOKIE. Run: cd apps/api && python manage.py make_help_session");
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
const targets = JSON.parse(readFileSync(join(here, "targets.json"), "utf8"));

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: THEME === "dark" ? "dark" : "light",
  ignoreHTTPSErrors: true,
});
// The web app is Vite with VITE_API_BASE_URL="" → same-origin /api calls on :3000
// (dev-proxied to the backend). Set the session cookie for BOTH origins so the
// browser sends it on same-origin fetches AND any direct :8000 calls.
await context.addCookies([
  { name: "session-id", value: COOKIE, url: BASE },
  { name: "session-id", value: COOKIE, url: API },
]);

async function api(path) {
  const res = await context.request.get(`${API}${path}`);
  if (!res.ok()) throw new Error(`${path} -> ${res.status()}`);
  return res.json();
}

let vars = { ws: WS };
try {
  const me = await api("/api/users/me/");
  const projects = await api(`/api/workspaces/${WS}/projects/`);
  const list = Array.isArray(projects) ? projects : projects.results || [];
  vars = { ws: WS, pid: list[0]?.id, uid: me.id };
  console.log("resolved vars:", vars);
} catch (e) {
  console.error("Could not resolve API vars (auth/route issue):", e.message);
  console.error("Workspace-level shots may still work; project-level ones will be skipped.");
}

const page = await context.newPage();
// Auth self-check from the BROWSER (same path the app uses): catch a sign-in
// redirect early instead of silently capturing the login page.
await page.goto(`${BASE}/${WS}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
const meStatus = await page.evaluate(async () => {
  try {
    const r = await fetch("/api/users/me/", { credentials: "include" });
    return r.status;
  } catch {
    return 0;
  }
});
console.log("browser /api/users/me/ ->", meStatus);
if (meStatus !== 200) {
  console.error("Browser is NOT authenticated (expected 200). Aborting — captures would be the sign-in page.");
  await browser.close();
  process.exit(2);
}

let ok = 0;
let fail = 0;
for (const t of targets) {
  const url = BASE + t.path.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "__MISSING__");
  if (url.includes("__MISSING__")) {
    console.log("SKIP", t.name, "(unresolved var) <-", url);
    fail++;
    continue;
  }
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(t.wait || 2500);
    await page.screenshot({ path: join(OUT, `${t.name}.png`) });
    console.log("OK  ", t.name, "<-", url);
    ok++;
  } catch (e) {
    console.log("FAIL", t.name, "<-", url, "::", e.message.split("\n")[0]);
    fail++;
  }
}
await browser.close();
console.log(`\nCaptured ${ok} ok, ${fail} failed/skipped -> ${OUT}`);
