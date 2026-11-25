/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { findRegressions, isHumanText, scanSource } from "./hardcoded.js";

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
  ].join("\n");
  assert.deepEqual(
    scanSource("x.tsx", src).map((h) => [h.line, h.text]),
    [
      [1, "Open menu"],
      [1, "Hello world"],
      [2, "Yes please"],
      [3, "Create project"],
      [4, "Untitled"],
    ]
  );
});

test("scanSource honours i18n-ignore on the same or previous line", () => {
  const src = [
    "// i18n-ignore: brand name",
    "const a = <b>Plane Cloud</b>;",
    'const c = { title: "Not ignored" };',
    'const b = { title: "Plane Cloud" }; // i18n-ignore: brand name',
  ].join("\n");
  assert.deepEqual(
    scanSource("x.tsx", src).map((h) => h.line),
    [3]
  );
});

test("findRegressions flags increases and new files only", () => {
  const baseline = { "a.tsx": 3, "b.tsx": 2, "gone.tsx": 1 };
  const current = { "a.tsx": 3, "b.tsx": 1, "c.tsx": 1, "d.tsx": 0 };
  assert.deepEqual(findRegressions(baseline, current), [{ file: "c.tsx", baseline: 0, current: 1 }]);
  assert.deepEqual(findRegressions(baseline, { "a.tsx": 4 }), [{ file: "a.tsx", baseline: 3, current: 4 }]);
});
