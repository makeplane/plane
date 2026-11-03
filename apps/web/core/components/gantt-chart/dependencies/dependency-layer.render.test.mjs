/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Renders the real GanttDependencyLayer (arrows + external stubs) to static SVG markup.
// The .tsx is bundled in memory with the esbuild already in the pnpm tree; store hooks, toast and
// the external picker are replaced by stubs, so no dependency is added.
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

const stubs = {
  "@/hooks/use-timeline-chart": "export const useTimeLineChartStore = () => globalThis.__ganttStore;",
  "@plane/propel/toast":
    'export const TOAST_TYPE = { ERROR: "error" }; export const setToast = (toast) => globalThis.__toasts.push(toast);',
  "@/hooks/store/use-project": "export const useProject = () => ({ getProjectById: () => undefined });",
  "./external-picker": "export const ExternalPicker = () => null;",
};

const stubPlugin = {
  name: "stubs",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => (args.path in stubs ? { path: args.path, namespace: "stub" } : null));
    build.onLoad({ filter: /.*/, namespace: "stub" }, (args) => ({ contents: stubs[args.path], loader: "js" }));
  },
};

const bundle = await esbuild.build({
  entryPoints: [join(here, "dependency-layer.tsx")],
  bundle: true,
  write: false,
  format: "cjs",
  platform: "node",
  jsx: "automatic",
  external: ["react", "react/jsx-runtime", "react-dom", "mobx", "mobx-react"],
  plugins: [stubPlugin],
  logLevel: "silent",
});
const moduleBox = { exports: {} };
new Function("module", "exports", "require", bundle.outputFiles[0].text)(moduleBox, moduleBox.exports, require);
const { GanttDependencyLayer } = moduleBox.exports;
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
require("mobx-react").enableStaticRendering(true);

const block = (id, start, end, marginLeft, width) => ({
  id,
  data: {},
  start_date: start,
  target_date: end,
  position: { marginLeft, width },
});

function render({ blocks, dependencies = [], externalLinks, actions, blockIds = blocks.map(({ id }) => id) }) {
  globalThis.__toasts = [];
  globalThis.__ganttStore = {
    getBlockById: (id) => blocks.find((item) => item.id === id),
    dependencyDraftFromId: null,
    dependencyDraftSide: "right",
    endDependencyDraft: () => {},
  };
  return renderToStaticMarkup(
    React.createElement(GanttDependencyLayer, {
      blockIds,
      dependencies,
      externalLinks,
      dependencyActions: actions,
      ganttContainerRef: { current: null },
      showAllBlocks: true,
      width: 800,
    })
  );
}

const ok = [block("a", "2026-11-02", "2026-11-04", 0, 100), block("b", "2026-11-05", "2026-11-07", 200, 100)];
const late = [block("a", "2026-11-02", "2026-11-09", 0, 100), block("b", "2026-11-05", "2026-11-07", 200, 100)];
const dep = [{ predecessorId: "a", successorId: "b", lagDays: 0 }];
const actions = { create: async () => {}, remove: async () => {}, otherPairs: [] };

test("a satisfied dependency draws one neutral arrow", () => {
  const html = render({ blocks: ok, dependencies: dep });
  assert.equal(html.match(/<path d="M[^"]*" fill="none" stroke="currentColor"/g).length, 1);
  assert.match(html, /class="text-tertiary"/);
  assert.doesNotMatch(html, /text-danger-primary" marker-end/);
  assert.match(html, /marker-end="url\(#[^)]*-dependency\)"/);
});

test("a violated dependency is drawn red and thicker", () => {
  const html = render({ blocks: late, dependencies: dep });
  assert.match(
    html,
    /stroke-width="2"[^>]*class="text-danger-primary[^"]*"[^>]*marker-end="url\(#[^)]*-dependency-violated\)"/
  );
});

test("lag shows as a label next to the predecessor", () => {
  const html = render({ blocks: ok, dependencies: [{ ...dep[0], lagDays: 2 }] });
  assert.match(html, /\+2d/);
  assert.doesNotMatch(render({ blocks: ok, dependencies: dep }), /\dd</);
});

test("an arrow to a row that is not shown is not drawn", () => {
  const html = render({ blocks: ok, dependencies: dep, blockIds: ["a"] });
  assert.doesNotMatch(html, /marker-end="url\(#[^)]*-dependency\)"/);
});

test("read-only layer has no hit target, editable layer has a keyboard-reachable one", () => {
  const readOnly = render({ blocks: ok, dependencies: dep });
  assert.doesNotMatch(readOnly, /data-gantt-dependency-control/);
  assert.match(readOnly, /aria-hidden="true"/);
  const editable = render({ blocks: ok, dependencies: dep, actions });
  assert.match(editable, /data-gantt-dependency-control[^>]*role="button"[^>]*tabindex="0"/);
  assert.doesNotMatch(editable, /aria-hidden="true"/);
});

test("external stub is red when the other project's dates break the order", () => {
  const link = {
    localId: "b",
    direction: "pred",
    externalId: "x",
    projectId: "p2",
    code: "HID-3",
    targetDate: "2026-11-09",
  };
  const html = render({ blocks: ok, externalLinks: [link] });
  assert.match(html, /stroke-dasharray="5 4"[^>]*class="text-danger-primary/);
  assert.match(html, /HID-3/);
});

test("external stub of an unreadable issue shows no name or code", () => {
  const link = { localId: "a", direction: "succ", externalId: "x", projectId: "p2" };
  const html = render({ blocks: ok, externalLinks: [link] });
  assert.match(html, /dự án khác/);
  assert.match(html, /stroke-dasharray="5 4"[^>]*class="text-tertiary"/);
});

test("a dependency to a row that is not shown becomes a labelled stub, not an arrow", () => {
  const peer = {
    localId: "b",
    direction: "pred",
    externalId: "a",
    projectId: "p",
    code: "AAA-1",
    targetDate: "2026-11-09",
    peer: true,
  };
  const html = render({ blocks: ok, dependencies: dep, externalLinks: [peer], blockIds: ["b"] });
  assert.match(html, /AAA-1/);
  assert.match(html, /stroke-dasharray="5 4"[^>]*class="text-danger-primary/);
  assert.doesNotMatch(html, /data-gantt-dependency-control/);
  // Both rows shown: the real arrow replaces the stub.
  const both = render({ blocks: ok, dependencies: dep, externalLinks: [peer] });
  assert.doesNotMatch(both, /AAA-1/);
});

test("external stub label shows the lag of a cross-project dependency", () => {
  const link = { localId: "a", direction: "succ", externalId: "x", projectId: "p2", code: "HID-3", lagDays: 2 };
  assert.match(render({ blocks: ok, externalLinks: [link] }), /HID-3 \+2d/);
  assert.doesNotMatch(render({ blocks: ok, externalLinks: [{ ...link, lagDays: 0 }] }), /\dd</);
});

test("typed dependencies anchor on the matching edges and show their type", () => {
  const typedDep = (depType) => [{ predecessorId: "a", successorId: "b", lagDays: 0, depType }];
  // a: x 0-100, b: x 200-300. SS leaves a's left edge (x=0), FF enters b's right edge (x=300).
  assert.match(render({ blocks: ok, dependencies: typedDep("SS") }), /d="M 0 22 H -8 V 66 H 200"/);
  assert.match(render({ blocks: ok, dependencies: typedDep("FF") }), /d="M 100 22 H 308 V 66 H 300"/);
  assert.match(render({ blocks: ok, dependencies: typedDep("SS") }), />SS</);
  assert.doesNotMatch(render({ blocks: ok, dependencies: typedDep("FS") }), />FS</);
});

test("a filtered-out typed dependency keeps its type in the stub colour and label", () => {
  const peer = {
    localId: "b",
    direction: "pred",
    externalId: "a",
    projectId: "p",
    code: "AAA-1",
    startDate: "2026-11-02",
    targetDate: "2026-11-09",
    depType: "SS",
    peer: true,
  };
  // b starts 11-05 after a starts 11-02: fine for SS even though a ends 11-09 (red under FS).
  const html = render({ blocks: ok, externalLinks: [peer], blockIds: ["b"] });
  assert.match(html, /AAA-1 SS/);
  assert.match(html, /stroke-dasharray="5 4"[^>]*class="text-tertiary"/);
  assert.match(
    render({ blocks: ok, externalLinks: [{ ...peer, depType: "FS" }], blockIds: ["b"] }),
    /class="text-danger-primary/
  );
});
