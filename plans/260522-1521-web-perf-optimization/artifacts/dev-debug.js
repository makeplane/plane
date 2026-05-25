import {
  getBrowser,
  getPage,
  disconnectBrowser,
} from "/Users/ngoctran/.claude/skills/chrome-devtools/scripts/lib/browser.js";
import fs from "fs";
const browser = await getBrowser({ headless: false });
const page = await getPage(browser);
await page.setViewport({ width: 1440, height: 900 });
const logs = [];
page.on("console", (m) => logs.push(`[console.${m.type()}] ${m.text().slice(0, 200)}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
page.on("requestfailed", (r) => logs.push(`[reqfail] ${r.url().slice(0, 160)} ${r.failure()?.errorText}`));
const t0 = Date.now();
await page
  .goto("http://localhost:3003/", { waitUntil: "networkidle2", timeout: 60000 })
  .catch((e) => logs.push(`[goto] ${e.message}`));
const t1 = Date.now() - t0;
await new Promise((r) => setTimeout(r, 4000));
const inputs = await page.evaluate(() =>
  Array.from(document.querySelectorAll("input")).map((i) => ({ type: i.type, name: i.name, id: i.id }))
);
const url = page.url();
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
fs.writeFileSync(
  "dev-debug.txt",
  JSON.stringify({ wallMs: t1, url, inputs, bodyText, logs: logs.slice(-30) }, null, 2)
);
console.log("wall=", t1, "url=", url, "inputs=", inputs.length);
await disconnectBrowser();
