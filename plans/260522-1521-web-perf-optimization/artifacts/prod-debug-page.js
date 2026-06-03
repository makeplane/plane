// Quick diagnostic: open prod root, capture console/errors, screenshot, dump DOM input tags.
import {
  getBrowser,
  getPage,
  disconnectBrowser,
} from "/Users/ngoctran/.claude/skills/chrome-devtools/scripts/lib/browser.js";
import fs from "fs";

const BASE = "http://localhost:3010";
const OUT = "/Users/ngoctran/Documents/Shinhan/plane/plans/260522-1521-web-perf-optimization/artifacts";

const browser = await getBrowser({ headless: false });
const page = await getPage(browser);
await page.setViewport({ width: 1440, height: 900 });

const logs = [];
page.on("console", (m) => logs.push(`[console.${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
page.on("requestfailed", (r) => logs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));

const client = await page.target().createCDPSession();
await client.send("Network.enable");
await client.send("Network.clearBrowserCache");
await client.send("Network.clearBrowserCookies");

await page
  .goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 60000 })
  .catch((e) => logs.push(`[goto] ${e.message}`));
await new Promise((r) => setTimeout(r, 3000));

const inputs = await page.evaluate(() =>
  Array.from(document.querySelectorAll("input")).map((i) => ({
    type: i.type,
    name: i.name,
    id: i.id,
    disabled: i.disabled,
    placeholder: i.placeholder,
  }))
);
const url = page.url();
const title = await page.title();
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));

await page.screenshot({ path: `${OUT}/prod-debug.png`, fullPage: false });
fs.writeFileSync(`${OUT}/prod-debug.txt`, JSON.stringify({ url, title, bodyText, inputs, logs }, null, 2));
console.log("url=", url, "title=", title);
console.log("inputs=", inputs);
console.log("logs (last 30)=", logs.slice(-30).join("\n"));
await disconnectBrowser();
