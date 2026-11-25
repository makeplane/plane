/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { findBlockedIncreases, findNewHits, findRegressions, isHumanText, scanSource } from "./hardcoded.js";

const hit = (line: number, text: string) => ({ file: "a.tsx", line, text });

test("isHumanText accepts copy and rejects keys, constants, URLs and identifiers", () => {
  for (const s of ["Save changes", "Cancel", "No results found.", " Delete "]) assert.ok(isHumanText(s), s);
  for (const s of ["common.save", "work-item", "ADMIN_ROLE", "https://plane.so", "/settings", "onClick", "ok", "42"]) {
    assert.ok(!isHumanText(s), s);
  }
});

test("scanSource finds JSX text, attributes, expression arms and object props", () => {
  const src = [
    'const a = <div title="Open menu">Hello world</div>;',
    'const b = <p>{flag ? "Yes please" : t("no")}</p>;',
    'const c = { label: "Create project", key: "Create project" };',
    'const d = <span className="text-sm">{name ?? "Untitled"}</span>;',
    'const e = { title: "Delete " + name, label: "Save changes" as const };',
  ].join("\n");
  assert.deepEqual(
    scanSource("x.tsx", src).map((h) => [h.line, h.text]),
    [
      [1, "Open menu"],
      [1, "Hello world"],
      [2, "Yes please"],
      [3, "Create project"],
      [4, "Untitled"],
      [5, "Delete"],
      [5, "Save changes"],
    ]
  );
});

test("scanSource honours i18n-ignore on the same or previous line", () => {
  const src = [
    "// i18n-ignore: brand name",
    "const a = <b>Plane Cloud</b>;",
    'const c = { title: "Not ignored" };',
    'const b = { title: "Plane Cloud" }; // i18n-ignore: brand name',
    'const d = { title: "Also not ignored" };',
    "const e = (<div>",
    "{/* i18n-ignore: brand name */}<span>Plane Cloud</span>",
    "<button>Save changes</button>",
    "{/* i18n-ignore: brand name */}",
    "<span>Plane Cloud</span>",
    "/* i18n-ignore: a */ <i>Plane</i> {/* b */}",
    "<button>Delete page</button>",
    "</div>);",
  ].join("\n");
  assert.deepEqual(
    scanSource("x.tsx", src).map((h) => h.line),
    [3, 5, 8, 12]
  );
});

test("findRegressions flags increases and new files only", () => {
  const baseline = { "a.tsx": 3, "b.tsx": 2, "gone.tsx": 1 };
  const current = { "a.tsx": 3, "b.tsx": 1, "c.tsx": 1, "d.tsx": 0 };
  assert.deepEqual(findRegressions(baseline, current), [{ file: "c.tsx", baseline: 0, current: 1 }]);
  assert.deepEqual(findRegressions(baseline, { "a.tsx": 4 }), [{ file: "a.tsx", baseline: 3, current: 4 }]);
});

test("findBlockedIncreases allows a renamed file but not new strings", () => {
  const baseline = { "old.tsx": 2, "a.tsx": 1 };
  assert.deepEqual(findBlockedIncreases(baseline, { "new.tsx": 2, "a.tsx": 1 }), []);
  assert.deepEqual(findBlockedIncreases(baseline, { "new.tsx": 3, "a.tsx": 1 }), [
    { file: "new.tsx", baseline: 0, current: 3 },
  ]);
  assert.deepEqual(findBlockedIncreases(baseline, { "old.tsx": 1, "a.tsx": 2 }), [
    { file: "a.tsx", baseline: 1, current: 2 },
  ]);
});

test("findNewHits reports only strings missing from the base, ignoring moves", () => {
  const base = [hit(1, "Save"), hit(2, "Cancel"), hit(3, "Cancel")];
  const current = [hit(1, "Cancel"), hit(5, "Save"), hit(6, "Cancel"), hit(7, "Cancel"), hit(9, "Delete page")];
  assert.deepEqual(findNewHits(base, current), [hit(7, "Cancel"), hit(9, "Delete page")]);
});
