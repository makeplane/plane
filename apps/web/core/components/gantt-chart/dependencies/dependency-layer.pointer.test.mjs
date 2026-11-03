/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Drives the real GanttDependencyLayer in jsdom with real pointer/mouse/keyboard events.
// Same esbuild bundling and stubs as dependency-layer.render.test.mjs; only the DOM is new.
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../../../../..");
const require = createRequire(join(root, "apps/web/package.json"));
const esbuildDir = readdirSync(join(root, "node_modules/.pnpm")).find((name) => name.startsWith("esbuild@"));
const esbuild = require(join(root, "node_modules/.pnpm", esbuildDir, "node_modules/esbuild"));

const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!doctype html><body></body>", { pretendToBeVisual: true });
const { window } = dom;
for (const key of ["window", "document", "Element", "Node", "HTMLElement", "SVGElement", "MouseEvent", "KeyboardEvent"])
  globalThis[key] = window[key];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const stubs = {
  "@/hooks/use-timeline-chart": "export const useTimeLineChartStore = () => globalThis.__ganttStore;",
  "@plane/propel/toast":
    'export const TOAST_TYPE = { ERROR: "error" }; export const setToast = (toast) => globalThis.__toasts.push(toast);',
  "@/hooks/store/use-project": "export const useProject = () => ({ getProjectById: () => undefined });",
  "./external-picker": "export const ExternalPicker = () => null;",
};
const bundle = await esbuild.build({
  entryPoints: [join(here, "dependency-layer.tsx")],
  bundle: true,
  write: false,
  format: "cjs",
  platform: "node",
  jsx: "automatic",
  external: ["react", "react/jsx-runtime", "react-dom", "mobx", "mobx-react"],
  plugins: [
    {
      name: "stubs",
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) =>
          args.path in stubs ? { path: args.path, namespace: "stub" } : null
        );
        build.onLoad({ filter: /.*/, namespace: "stub" }, (args) => ({ contents: stubs[args.path], loader: "js" }));
      },
    },
  ],
  logLevel: "silent",
});
const moduleBox = { exports: {} };
new Function("module", "exports", "require", bundle.outputFiles[0].text)(moduleBox, moduleBox.exports, require);
const { GanttDependencyLayer } = moduleBox.exports;
const React = require("react");
const { createRoot } = require("react-dom/client");

const block = (id, marginLeft) => ({
  id,
  data: {},
  start_date: "2026-11-02",
  target_date: "2026-11-04",
  position: { marginLeft, width: 100 },
});
const blocks = [block("a", 0), block("b", 200)];

// Mounts the layer with a draft started from `fromId`; `hover` is what elementFromPoint returns.
async function startDrag({ fromId = "a", side = "right", hover }) {
  const created = [];
  const container = document.createElement("div");
  document.body.append(container);
  const barB = document.createElement("div");
  barB.id = "gantt-block-b";
  const gantt = document.createElement("div");
  const mount = document.createElement("div");
  gantt.append(barB, mount);
  container.append(gantt);
  let ended = 0;
  globalThis.__toasts = [];
  globalThis.__ganttStore = {
    getBlockById: (id) => blocks.find((item) => item.id === id),
    dependencyDraftFromId: fromId,
    dependencyDraftSide: side,
    endDependencyDraft: () => ended++,
  };
  document.elementFromPoint = () => ({ b: barB, none: container })[hover] ?? null;
  const root = createRoot(mount);
  await React.act(async () => {
    root.render(
      React.createElement(GanttDependencyLayer, {
        blockIds: ["a", "b"],
        dependencies: [],
        dependencyActions: { create: async (p, s) => created.push([p, s]), remove: async () => {}, otherPairs: [] },
        ganttContainerRef: { current: gantt },
        showAllBlocks: true,
        width: 800,
      })
    );
  });
  return {
    created,
    ended: () => ended,
    fire: (event) => React.act(async () => void document.dispatchEvent(event)),
    unmount: () => React.act(async () => root.unmount()).then(() => container.remove()),
  };
}

const mouse = (type, init = {}) => new window.MouseEvent(type, { bubbles: true, clientX: 250, clientY: 20, ...init });
const touch = (type) => {
  const event = new window.Event(type, { bubbles: true });
  Object.assign(event, { pointerType: "touch", clientX: 250, clientY: 20 });
  return event;
};

test("releasing the mouse over another bar creates the dependency", async () => {
  const drag = await startDrag({ hover: "b" });
  await drag.fire(mouse("mousemove"));
  await drag.fire(mouse("mouseup"));
  assert.deepEqual(drag.created, [["a", "b"]]);
  assert.ok(drag.ended() >= 1);
  await drag.unmount();
});

test("dragging from the left handle reverses the direction", async () => {
  const drag = await startDrag({ side: "left", hover: "b" });
  await drag.fire(mouse("mouseup"));
  assert.deepEqual(drag.created, [["b", "a"]]);
  await drag.unmount();
});

test("a touch pointer drag works the same way", async () => {
  const drag = await startDrag({ hover: "b" });
  await drag.fire(touch("pointermove"));
  await drag.fire(touch("pointerup"));
  assert.deepEqual(drag.created, [["a", "b"]]);
  await drag.unmount();
});

test("releasing outside any bar creates nothing", async () => {
  const drag = await startDrag({ hover: "none" });
  await drag.fire(mouse("mouseup"));
  assert.deepEqual(drag.created, []);
  await drag.unmount();
});

test("releasing on the source bar itself shows the error toast and creates nothing", async () => {
  const drag = await startDrag({ fromId: "b", hover: "b" });
  await drag.fire(mouse("mouseup"));
  assert.deepEqual(drag.created, []);
  assert.equal(globalThis.__toasts.length, 1);
  assert.equal(globalThis.__toasts[0].title, "Không nối được");
  await drag.unmount();
});

test("Escape cancels the drag so a later release creates nothing", async () => {
  const drag = await startDrag({ hover: "b" });
  await drag.fire(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  assert.ok(drag.ended() >= 1);
  await drag.fire(mouse("mouseup"));
  assert.deepEqual(drag.created, []);
  await drag.unmount();
});

test("a touch cancel ends the drag without creating", async () => {
  const drag = await startDrag({ hover: "b" });
  await drag.fire(touch("pointercancel"));
  await drag.fire(mouse("mouseup"));
  assert.deepEqual(drag.created, []);
  await drag.unmount();
});
