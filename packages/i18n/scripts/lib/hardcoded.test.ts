/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { findNewHits, isHumanText, scanSource } from "./hardcoded.js";

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

test("findNewHits reports only strings missing from the base, ignoring moves", () => {
  const base = [hit(1, "Save"), hit(2, "Cancel"), hit(3, "Cancel")];
  const current = [hit(1, "Cancel"), hit(5, "Save"), hit(6, "Cancel"), hit(7, "Cancel"), hit(9, "Delete page")];
  assert.deepEqual(findNewHits(base, current), [hit(7, "Cancel"), hit(9, "Delete page")]);
});

test("findNewHits cancels strings that moved to another file", () => {
  const base = [
    { file: "old.tsx", line: 4, text: "Save" },
    { file: "old.tsx", line: 9, text: "Cancel" },
  ];
  const current = [
    { file: "new/a.tsx", line: 1, text: "Cancel" },
    { file: "new/b.tsx", line: 2, text: "Save" },
    { file: "new/b.tsx", line: 3, text: "Delete page" },
  ];
  assert.deepEqual(findNewHits(base, current), [{ file: "new/b.tsx", line: 3, text: "Delete page" }]);
});
