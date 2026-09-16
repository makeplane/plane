import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const require = createRequire(path.join(web, "package.json"));
const { build } = require(process.env.ESBUILD_PACKAGE_PATH || "esbuild");
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE_PATH || "playwright");
const styleRequire = createRequire(require.resolve("@plane/tailwind-config"));
const tailwind = styleRequire("tailwindcss");
const postcss = createRequire(styleRequire.resolve("tailwindcss"))("postcss");
const screenshots = process.env.NARRATION_SCREENSHOTS || "/tmp/kanavio-narration-browser";
await mkdir(screenshots, { recursive: true });
const bundle = await build({
  absWorkingDir: web,
  entryPoints: ["core/components/annotation/components/__tests__/narration-browser-fixture.tsx"],
  bundle: true,
  write: false,
  outdir: "/tmp/narration-bundle",
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  alias: { "@": path.join(web, "core") },
  define: { "process.env.NODE_ENV": '"development"', "process.env": "{}" },
  loader: { ".woff2": "dataurl", ".woff": "dataurl", ".svg": "dataurl", ".png": "dataurl" },
});
const root = postcss.parse(await readFile(path.join(web, "styles/globals.css"), "utf8"));
root.walkAtRules("import", (rule) => rule.remove());
const css = (
  await postcss([
    tailwind({
      ...require(path.join(web, "tailwind.config.js")),
      content: [
        path.join(web, "core/components/annotation/**/*.{ts,tsx}"),
        path.join(web, "../../packages/{ui,propel}/src/**/*.{ts,tsx}"),
      ],
    }),
  ]).process(root, { from: path.join(web, "styles/globals.css") })
).css;
const video = await readFile(process.env.NARRATION_TEST_VIDEO || "/tmp/kanavio-narration-test.mp4");
const html =
  '<!doctype html><html class="dark" data-theme="dark"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"><title>Narration browser test</title></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>';
const server = createServer((req, res) => {
  if (req.url === "/fixture.mp4") {
    const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || "");
    const start = range ? Number(range[1]) : 0;
    const end = range?.[2] ? Math.min(Number(range[2]), video.length - 1) : video.length - 1;
    res
      .writeHead(range ? 206 : 200, {
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        ...(range ? { "Content-Range": `bytes ${start}-${end}/${video.length}` } : {}),
      })
      .end(video.subarray(start, end + 1));
    return;
  }
  const resources = {
    "/": ["text/html", html],
    "/fixture.js": ["text/javascript", bundle.outputFiles.find((file) => file.path.endsWith(".js")).text],
    "/fixture.css": [
      "text/css",
      css +
        bundle.outputFiles
          .filter((file) => file.path.endsWith(".css"))
          .map((file) => file.text)
          .join("\n"),
    ],
    "/fixture.mp4": ["video/mp4", video],
  };
  const resource = resources[req.url];
  if (!resource) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "Content-Type": resource[0] }).end(resource[1]);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  headless: true,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
await page.addInitScript(() => {
  window.narrationTestStreams = [];
  const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = async (constraints) => {
    const stream = await getUserMedia(constraints);
    window.narrationTestStreams.push(stream);
    return stream;
  };
  window.narrationTestGetUserMedia = navigator.mediaDevices.getUserMedia;
});
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (dialog) => dialog.dismiss());
const wait = async (test) => page.waitForFunction(test);
try {
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector("video")?.readyState >= 2);
  assert.equal(await page.getByText("Voice narration", { exact: true }).count(), 0);
  assert.equal(await page.getByText("No narrations", { exact: true }).count(), 0);
  await page.evaluate(() => {
    document.querySelector("video").currentTime = 4;
  });
  await page.waitForFunction(
    () => !document.querySelector("video").seeking && Math.abs(document.querySelector("video").currentTime - 4) < 0.1
  );
  await page.getByRole("button", { name: "Voice narration (Shift + R)", exact: true }).click();
  await page.getByRole("button", { name: "Start recording", exact: true }).waitFor();
  await wait(
    () =>
      !document.querySelector("button")?.disabled &&
      [...document.querySelectorAll("button")].some((b) => b.textContent === "Start recording" && !b.disabled)
  );
  assert.equal(await page.getByText("Recording narration", { exact: true }).count(), 0);
  assert.equal(await page.getByRole("checkbox", { name: "3-second countdown", exact: true }).isChecked(), false);
  await page.screenshot({ path: `${screenshots}/01-prepare-desktop.png`, fullPage: true });
  await page.getByRole("button", { name: "Start recording", exact: true }).click();
  await page.getByText("Recording narration", { exact: true }).first().waitFor();
  assert.equal(await page.getByText("Get ready... 3", { exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => document.querySelector("video").paused), false);
  assert.ok((await page.evaluate(() => document.querySelector("video").currentTime)) >= 4);
  // Routine player events must not pause capture or resurrect the Start button.
  await page.evaluate(() => {
    const video = document.querySelector("video");
    for (const type of ["waiting", "stalled", "pause", "ratechange", "error", "ended"])
      video.dispatchEvent(new Event(type));
  });
  await page.getByLabel("Logical timeline at end", { exact: true }).check();
  await page.waitForTimeout(2000);
  assert.equal(await page.getByText("Recording narration", { exact: true }).count(), 2);
  assert.equal(await page.getByRole("button", { name: "Start recording", exact: true }).count(), 0);
  assert.notEqual(await page.getByRole("timer").innerText(), "00:00");
  assert.equal(await page.evaluate(() => document.querySelector("video").paused), false);
  await page.getByLabel("Logical timeline at end", { exact: true }).uncheck();
  await page.screenshot({ path: `${screenshots}/02-recording-desktop.png`, fullPage: true });
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByText("Narration paused", { exact: true }).first().waitFor();
  assert.equal(await page.getByText("Narration paused", { exact: true }).count(), 2);
  const pausedTime = await page.evaluate(() => document.querySelector("video").currentTime);
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => document.querySelector("video").currentTime), pausedTime);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByText("Recording narration", { exact: true }).first().waitFor();
  await page.waitForTimeout(1800);
  await page.getByRole("button", { name: "Stop voice narration recording" }).click();
  await page.getByLabel("Narration name", { exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Done", exact: true }).count(), 0);
  assert.equal(await page.getByLabel("Narration name", { exact: true }).inputValue(), "Narration 01");
  assert.equal(
    await page.evaluate(() =>
      window.narrationTestStreams.every((stream) => stream.getTracks().every((track) => track.readyState === "ended"))
    ),
    true
  );
  assert.equal(
    await page
      .getByRole("img", { name: "Narration waveform", exact: true })
      .first()
      .evaluate((canvas) =>
        [...canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data].some(
          (value, i) => i % 4 === 3 && value > 0
        )
      ),
    true
  );
  await page.screenshot({ path: `${screenshots}/03-inspector-desktop.png`, fullPage: true });
  assert.equal(await page.getByTestId("dirty").innerText(), "Unsaved changes");
  await page.getByRole("button", { name: "Refresh annotations", exact: true }).click();
  assert.equal(await page.getByLabel("Narration name", { exact: true }).inputValue(), "Narration 01");
  await page.getByLabel("Fail save", { exact: true }).check();
  await page.getByRole("button", { name: "Save editor", exact: true }).click();
  await wait(() => document.querySelector('[data-testid="save-result"]').textContent === "false");
  assert.equal(await page.getByTestId("dirty").innerText(), "Unsaved changes");
  await page.getByLabel("Fail save", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Save editor", exact: true }).click();
  await wait(() => document.querySelector('[data-testid="save-result"]').textContent === "true");
  const clips = JSON.parse(await page.getByTestId("saved-json").innerText());
  assert.equal(clips.length, 1);
  assert.ok(clips[0].audio.peaks.length > 0);
  assert.ok(Math.abs(clips[0].startTime - 4) < 0.2);
  assert.ok(clips[0].audio.sourceDuration > 3 && clips[0].audio.sourceDuration < 6);
  await page.getByRole("button", { name: /^Narration 01, starts/ }).click();
  await page.getByLabel("Narration name", { exact: true }).fill("Defensive rotation");
  await page.getByLabel("Trim end in seconds", { exact: true }).fill("0.4");
  await page.getByRole("button", { name: "Trim narration end", exact: true }).press("ArrowLeft");
  assert.equal(Number(await page.getByLabel("Trim end in seconds", { exact: true }).inputValue()), 0.5);
  assert.equal(await page.getByTestId("dirty").innerText(), "Unsaved changes");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "Stop preview", exact: true }).waitFor();
  await page.getByRole("button", { name: "Stop preview", exact: true }).click();
  await page.evaluate(async () => {
    const video = document.querySelector("video");
    video.volume = 0.8;
    video.currentTime = 4.2;
    await video.play();
  });
  await page.waitForFunction(() => document.querySelector("video").volume < 0.4);
  await page.evaluate(() => {
    const video = document.querySelector("video");
    video.pause();
    video.currentTime = 12;
  });
  await page.waitForFunction(() => Math.abs(document.querySelector("video").volume - 0.8) < 0.01);
  await page.screenshot({ path: `${screenshots}/04-inspector-desktop.png`, fullPage: true });
  await page.getByRole("button", { name: "Replace", exact: true }).click();
  await page.getByRole("button", { name: "Cancel replacement", exact: true }).click();
  await page.getByRole("button", { name: /^Defensive rotation, starts/ }).click();
  assert.equal(await page.getByLabel("Narration name", { exact: true }).inputValue(), "Defensive rotation");
  await page.getByRole("button", { name: "Narration actions", exact: true }).click();
  const narrationMenuButtons = page.getByRole("menu").locator("button");
  assert.equal(await narrationMenuButtons.count(), 5);
  assert.equal(
    await narrationMenuButtons.evaluateAll((buttons) =>
      buttons.every((button) => {
        const style = window.getComputedStyle(button);
        return style.display === "flex" && style.alignItems === "center";
      })
    ),
    true
  );
  await page.screenshot({ path: `${screenshots}/04-actions-menu-desktop.png`, fullPage: true });
  await page.getByText("Duplicate", { exact: true }).click();
  await page.getByRole("alertdialog", { name: "Overlapping narrations" }).waitFor();
  await page.getByRole("button", { name: "Add another narration", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: /Defensive rotation.*starts/ }).count(), 2);
  const trackBoxes = await page
    .getByRole("button", { name: /Defensive rotation.*starts/ })
    .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().y));
  assert.ok(Math.abs(trackBoxes[1] - trackBoxes[0]) >= 64);
  const beforeZoom = await page
    .getByRole("button", { name: /Defensive rotation.*starts/ })
    .first()
    .boundingBox();
  await page.getByRole("button", { name: "Zoom timeline in", exact: true }).click();
  const afterZoom = await page
    .getByRole("button", { name: /Defensive rotation.*starts/ })
    .first()
    .boundingBox();
  assert.ok(afterZoom.width > beforeZoom.width);
  await page.mouse.move(0, 0);
  await page.getByText("Annotations saved", { exact: true }).waitFor({ state: "hidden", timeout: 15000 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${screenshots}/05-inspector-mobile.png`, fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.getByRole("button", { name: "New narration", exact: true }).click();
  await page.getByRole("button", { name: "Start recording", exact: true }).click();
  await page.getByText("Recording narration", { exact: true }).first().waitFor();
  const stopBounds = await page.getByRole("button", { name: "Stop voice narration recording" }).boundingBox();
  assert.ok(stopBounds.y >= 0 && stopBounds.y + stopBounds.height <= 844);
  await page.screenshot({ path: `${screenshots}/06-recording-mobile.png`, fullPage: true });
  await page.getByRole("button", { name: "Cancel recording", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: /Defensive rotation.*starts/ }).count(), 2);
  assert.equal(
    await page.evaluate(() =>
      window.narrationTestStreams.every((stream) => stream.getTracks().every((track) => track.readyState === "ended"))
    ),
    true
  );
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Permission denied", "NotAllowedError");
    };
  });
  await page.getByRole("button", { name: "Check microphone", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Microphone access is required" }).waitFor();
  await page.screenshot({ path: `${screenshots}/07-permission-error-mobile.png`, fullPage: true });
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = window.narrationTestGetUserMedia;
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Check microphone", exact: true }).click();
  await page.getByRole("button", { name: "Start recording", exact: true }).click();
  await page.getByText("Recording narration", { exact: true }).first().waitFor();
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press("Space");
  await page.getByText("Narration paused", { exact: true }).first().waitFor();
  await page.keyboard.press("Space");
  await page.getByText("Recording narration", { exact: true }).first().waitFor();
  await page.evaluate(() => {
    document.querySelector("video").currentTime = 25;
  });
  await page.getByRole("alert").filter({ hasText: "interrupted by a seek" }).waitFor();
  assert.equal(await page.getByRole("button", { name: /Defensive rotation.*starts/ }).count(), 2);

  // Reaching the end finalizes a short take instead of leaving the recorder active.
  await page.evaluate(() => {
    document.querySelector("video").currentTime = 28;
  });
  await page.waitForFunction(() => !document.querySelector("video").seeking);
  await page.getByRole("button", { name: "Check microphone", exact: true }).click();
  await page.getByRole("button", { name: "Start recording", exact: true }).click();
  await page.getByRole("button", { name: /^Narration 03, starts/ }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Done", exact: true }).count(), 0);
  await page.getByRole("button", { name: "Save editor", exact: true }).click();
  await page.waitForFunction(
    () => JSON.parse(document.querySelector('[data-testid="saved-json"]').textContent).length === 3
  );
  const endedClips = JSON.parse(await page.getByTestId("saved-json").innerText());
  const last = endedClips.find((clip) => clip.startTime >= 27);
  assert.ok(last && last.endTime <= 30.001 && last.endTime > 29.5);

  // A failed replacement retains the existing audio, even when the hardware disappears.
  await page.getByRole("button", { name: /^Narration 03, starts/ }).click();
  await page.getByLabel("Trim end in seconds", { exact: true }).fill("0");
  const lastClipLabel = await page.getByRole("button", { name: /^Narration 03, starts/ }).getAttribute("aria-label");
  assert.ok(Number(/duration ([\d.]+)/.exec(lastClipLabel)[1]) <= 2.01);
  await page.getByRole("button", { name: "Replace", exact: true }).click();
  await page.getByRole("button", { name: "Start recording", exact: true }).click();
  await page.getByText("Recording narration", { exact: true }).first().waitFor();
  await page.evaluate(() => window.narrationTestStreams.at(-1).getAudioTracks()[0].dispatchEvent(new Event("ended")));
  await page.getByRole("alert").filter({ hasText: "microphone disconnected" }).waitFor();
  assert.equal(
    JSON.parse(await page.getByTestId("saved-json").innerText()).find((clip) => clip.id === last.id).content,
    last.content
  );
  assert.equal(
    await page.evaluate(() =>
      window.narrationTestStreams.every((stream) => stream.getTracks().every((track) => track.readyState === "ended"))
    ),
    true
  );
  // A pending overlap must never commit a clip into another media session.
  await page.getByRole("button", { name: "Cancel replacement", exact: true }).click();
  await page.getByRole("button", { name: /^Narration 03, starts/ }).click();
  const selectedLastClip = page.getByRole("button", { name: /^Narration 03, starts/ });
  await selectedLastClip.hover();
  await selectedLastClip.locator("..").getByRole("button", { name: "Narration actions", exact: true }).click();
  await page.getByText("Duplicate", { exact: true }).click();
  await page.getByRole("alertdialog", { name: "Overlapping narrations" }).waitFor();
  await page.getByRole("button", { name: "Switch media", exact: true }).click();
  await page.getByRole("button", { name: "Voice narration (Shift + R)", exact: true }).click();
  await page.getByRole("button", { name: "Start recording", exact: true }).waitFor();
  assert.equal(await page.getByRole("alertdialog", { name: "Overlapping narrations" }).count(), 0);
  assert.equal(await page.getByRole("button", { name: /, starts .*duration/ }).count(), 0);
  assert.equal(await page.getByTestId("dirty").innerText(), "Saved");
  // Switching to a drawing tool releases a preparation-only microphone as well.
  await page.getByRole("button", { name: "Freehand draw", exact: true }).click();
  await page.waitForFunction(() =>
    window.narrationTestStreams.every((stream) => stream.getTracks().every((track) => track.readyState === "ended"))
  );
  // A take can pass 22 seconds; deleting it prepares the next take without Check microphone.
  await page.evaluate(() => {
    document.querySelector("video").currentTime = 0;
  });
  await page.waitForFunction(() => !document.querySelector("video").seeking);
  await page.getByRole("button", { name: "Voice narration (Shift + R)", exact: true }).click();
  await page.getByRole("button", { name: "Start recording", exact: true }).click();
  await page.getByText("Recording narration", { exact: true }).first().waitFor();
  await page.waitForTimeout(25000);
  assert.equal(await page.getByText("Recording narration", { exact: true }).count(), 2);
  await page.getByRole("button", { name: "Stop voice narration recording" }).click();
  await page.getByRole("button", { name: /^Narration 01, starts/ }).waitFor();
  await page.getByRole("button", { name: "Delete narration", exact: true }).click();
  await page.getByRole("button", { name: "Start recording", exact: true }).click();
  await page.getByText("Recording narration", { exact: true }).first().waitFor();
  await page.getByRole("button", { name: "Cancel recording", exact: true }).click();
  // Ignoring transient player events must not mask a genuine media failure.
  await page.getByRole("button", { name: "Voice narration (Shift + R)", exact: true }).click();
  await page.getByRole("button", { name: "Start recording", exact: true }).click();
  await page.getByText("Recording narration", { exact: true }).first().waitFor();
  await page.evaluate(() => {
    const video = document.querySelector("video");
    video.src = "/missing-video.mp4";
    video.load();
  });
  await page.getByRole("alert").filter({ hasText: "Video playback failed" }).waitFor();
  assert.equal(await page.getByText("Recording narration", { exact: true }).count(), 0);
  assert.equal(
    await page.evaluate(() =>
      window.narrationTestStreams.every((stream) => stream.getTracks().every((track) => track.readyState === "ended"))
    ),
    true
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        sourceDuration: clips[0].audio.sourceDuration,
        startTime: clips[0].startTime,
        waveformPeaks: clips[0].audio.peaks.length,
        screenshots,
        errors,
      },
      null,
      2
    )
  );
} catch (error) {
  await page.screenshot({ path: `${screenshots}/failure.png`, fullPage: true });
  console.error(await page.locator("body").innerText(), errors);
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
