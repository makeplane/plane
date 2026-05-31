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
const ADMIN_BASE = process.env.ADMIN_URL || "http://localhost:3001"; // God Mode app
const API = process.env.API_URL || "http://localhost:8000";
const COOKIE = process.env.SHOT_COOKIE;
const WS = process.env.WS_SLUG || "help-demo";
const THEME = process.env.THEME || "light";
const OUT = join(here, "out");
// A target's `base` selects which app to hit: "web" (default, :3000) or "admin"
// (God Mode, :3001). Both share the same session cookie (instance-admin user).
const baseFor = (t) => (t.base === "admin" ? ADMIN_BASE : BASE);

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
  { name: "session-id", value: COOKIE, url: ADMIN_BASE },
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
  const pid = list[0]?.id;
  vars = { ws: WS, pid, uid: me.id };
  // Resolve first-of-kind entity ids (best-effort) so detail/sub-routes can be
  // templated as {iid}/{cid}/{mid}/{pgid}/{vid}. Each is independent: a failure
  // only skips targets that reference that var.
  const firstId = async (path) => {
    try {
      const data = await api(path);
      const list = Array.isArray(data) ? data : data.results || [];
      return list[0]?.id;
    } catch {
      return undefined;
    }
  };
  vars.iid = await firstId(`/api/workspaces/${WS}/projects/${pid}/issues/`);
  vars.cid = await firstId(`/api/workspaces/${WS}/projects/${pid}/cycles/`);
  vars.mid = await firstId(`/api/workspaces/${WS}/projects/${pid}/modules/`);
  vars.pgid = await firstId(`/api/workspaces/${WS}/projects/${pid}/pages/`);
  vars.vid = await firstId(`/api/workspaces/${WS}/projects/${pid}/views/`);
  vars.did = await firstId(`/api/workspaces/${WS}/dashboards/`);
  console.log("resolved vars:", vars);
} catch (e) {
  console.error("Could not resolve API vars (auth/route issue):", e.message);
  console.error("Workspace-level shots may still work; project-level ones will be skipped.");
}

// Run optional interaction steps (open a modal, press Cmd+K, hover) before capture.
async function runSteps(page, steps) {
  for (const s of steps || []) {
    if (s.press) await page.keyboard.press(s.press).catch(() => {});
    else if (s.click) await page.click(s.click, { timeout: 6000 }).catch(() => {});
    else if (s.hover) await page.hover(s.hover, { timeout: 6000 }).catch(() => {});
    if (s.wait) await page.waitForTimeout(s.wait);
  }
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

// Optional filter: capture only the named targets (comma-separated), e.g.
//   SHOT_ONLY="analytics-overview-tab,dashboard-list" node capture.mjs
const only = (process.env.SHOT_ONLY || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const selected = only.length ? targets.filter((t) => only.includes(t.name)) : targets;
if (only.length) console.log("SHOT_ONLY ->", selected.map((t) => t.name).join(", ") || "(no match)");

let ok = 0;
let fail = 0;
for (const t of selected) {
  const url = baseFor(t) + t.path.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "__MISSING__");
  if (url.includes("__MISSING__")) {
    console.log("SKIP", t.name, "(unresolved var) <-", url);
    fail++;
    continue;
  }
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(t.wait || 2500);
    await runSteps(page, t.steps);
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
