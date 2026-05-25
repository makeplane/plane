// Login first, then measure 2 authenticated pages with 4 cache scenarios each.
import {
  getBrowser,
  getPage,
  disconnectBrowser,
  outputJSON,
  outputError,
} from "/Users/ngoctran/.claude/skills/chrome-devtools/scripts/lib/browser.js";
import fs from "fs";

const EMAIL = "ngocyt001@gmail.com";
const PASSWORD = "Shb@25505866";
const BASE = "http://localhost:3000";
const TARGETS = [`${BASE}/yesyes/ho/?view=datasheet`, `${BASE}/yesyes/profile/11d01b65-7154-48cf-8852-975c36ec8907/`];
const OUT = "/Users/ngoctran/Documents/Shinhan/plane/plans/260522-1521-web-perf-optimization/artifacts";

function attachNetCollector(client) {
  const reqs = new Map();
  const done = [];
  const onSend = (e) =>
    reqs.set(e.requestId, { url: e.request.url, method: e.request.method, type: e.type, startTime: e.timestamp });
  const onResp = (e) => {
    const r = reqs.get(e.requestId);
    if (r) {
      r.status = e.response.status;
      r.fromCache = e.response.fromDiskCache;
      r.timing = e.response.timing;
    }
  };
  const onFin = (e) => {
    const r = reqs.get(e.requestId);
    if (r) {
      r.endTime = e.timestamp;
      r.duration = (r.endTime - r.startTime) * 1000;
      r.encodedDataLength = e.encodedDataLength;
      done.push(r);
    }
  };
  const onFail = (e) => {
    const r = reqs.get(e.requestId);
    if (r) {
      r.failed = true;
      r.errorText = e.errorText;
      done.push(r);
    }
  };
  client.on("Network.requestWillBeSent", onSend);
  client.on("Network.responseReceived", onResp);
  client.on("Network.loadingFinished", onFin);
  client.on("Network.loadingFailed", onFail);
  return {
    done,
    detach() {
      client.off("Network.requestWillBeSent", onSend);
      client.off("Network.responseReceived", onResp);
      client.off("Network.loadingFinished", onFin);
      client.off("Network.loadingFailed", onFail);
    },
  };
}

function summarize(label, wallMs, requests, extra = {}) {
  const scripts = requests.filter((r) => r.type === "Script");
  const xhrs = requests.filter((r) => r.type === "XHR" || r.type === "Fetch");
  const byType = requests.reduce((a, r) => {
    a[r.type] = (a[r.type] || 0) + 1;
    return a;
  }, {});
  const byStatus = requests.reduce((a, r) => {
    const k = r.status ? `${Math.floor(r.status / 100)}xx` : "failed";
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {});
  const slowXhrs = [...xhrs]
    .sort((a, b) => (b.duration || 0) - (a.duration || 0))
    .slice(0, 10)
    .map((r) => ({
      ms: Math.round(r.duration || 0),
      ttfb: r.timing ? Math.round(r.timing.receiveHeadersEnd - r.timing.sendEnd) : null,
      status: r.status,
      size: r.encodedDataLength,
      url: r.url.slice(0, 160),
    }));
  return {
    label,
    wallMs,
    requests: requests.length,
    scripts: scripts.length,
    xhrs: xhrs.length,
    totalBytes: requests.reduce((s, r) => s + (r.encodedDataLength || 0), 0),
    scriptsBytes: scripts.reduce((s, r) => s + (r.encodedDataLength || 0), 0),
    aggregatedNetworkMs: Math.round(requests.reduce((s, r) => s + (r.duration || 0), 0)),
    status304: requests.filter((r) => r.status === 304).length,
    byType,
    byStatus,
    slowestXhrs: slowXhrs,
    ...extra,
  };
}

async function login(page, client) {
  console.error("[login] navigating to", BASE);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 60000 });

  // step 1: fill email — visible field is #login-identifier (type=text), not the hidden name="email"
  await page.waitForSelector("#login-identifier", { visible: true, timeout: 30000 });
  const emailSel = "#login-identifier";
  await page.evaluate((s) => {
    const el = document.querySelector(s);
    el?.focus();
    el && (el.value = "");
  }, emailSel);
  await page.type(emailSel, EMAIL, { delay: 5 });
  // submit by Enter
  await page.keyboard.press("Enter");

  // step 2: wait password
  await page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 500));
  const pwSel = 'input[type="password"]';
  await page.evaluate((s) => {
    const el = document.querySelector(s);
    el?.focus();
    el && (el.value = "");
  }, pwSel);
  await page.type(pwSel, PASSWORD, { delay: 5 });

  // submit via Enter (triggers form's onSubmit React handler -> formRef.current.submit())
  const loginT0 = Date.now();
  await Promise.all([
    page.keyboard.press("Enter"),
    page
      .waitForNavigation({ waitUntil: "networkidle2", timeout: 90000 })
      .catch((e) => console.error("[login] nav wait:", e.message)),
  ]);
  const loginMs = Date.now() - loginT0;
  console.error("[login] complete in", loginMs, "ms -> ", page.url());
  return { loginMs, url: page.url() };
}

async function measure(label, page, client, url, disableCache) {
  await client.send("Network.setCacheDisabled", { cacheDisabled: disableCache });
  const collector = attachNetCollector(client);
  const t0 = Date.now();
  await page
    .goto(url, { waitUntil: "networkidle2", timeout: 120000 })
    .catch((e) => console.error("[measure]", label, "nav:", e.message));
  const wallMs = Date.now() - t0;
  await new Promise((r) => setTimeout(r, 1500));
  collector.detach();
  return summarize(label, wallMs, collector.done, { cacheDisabled: disableCache, finalUrl: page.url() });
}

async function run() {
  const browser = await getBrowser({ headless: false });
  const page = await getPage(browser);
  await page.setViewport({ width: 1440, height: 900 });
  const client = await page.target().createCDPSession();
  await client.send("Network.enable");
  await client.send("Network.clearBrowserCache");
  await client.send("Network.clearBrowserCookies");

  const loginInfo = await login(page, client);

  const results = { login: loginInfo, targets: [] };

  for (const target of TARGETS) {
    console.error(`\n=== target ${target} ===`);
    const passes = [];
    // 1. Cold-ish (first visit) with cache enabled
    passes.push(await measure("cold-cache-enabled", page, client, target, false));
    // 2. Warm cache enabled (same URL again)
    passes.push(await measure("warm-cache-enabled", page, client, target, false));
    // 3. Cache disabled (simulate DevTools toggle)
    passes.push(await measure("warm-cache-disabled", page, client, target, true));
    // 4. Cache disabled second time
    passes.push(await measure("warm-cache-disabled-2", page, client, target, true));
    results.targets.push({ url: target, passes });
    // Re-enable cache and clear for next target so cold pass means cold
    await client.send("Network.setCacheDisabled", { cacheDisabled: false });
    await client.send("Network.clearBrowserCache");
  }

  fs.writeFileSync(`${OUT}/dev-after-phase2.json`, JSON.stringify(results, null, 2));
  outputJSON({
    login: loginInfo,
    summary: results.targets.map((t) => ({
      url: t.url,
      passes: t.passes.map((p) => ({
        label: p.label,
        wallMs: p.wallMs,
        requests: p.requests,
        scripts: p.scripts,
        xhrs: p.xhrs,
        totalKB: Math.round(p.totalBytes / 1024),
        aggregatedNetMs: p.aggregatedNetworkMs,
        status304: p.status304,
      })),
    })),
  });

  await disconnectBrowser();
}

run().catch(outputError);
