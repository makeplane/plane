/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const PACKAGE_ROOT = path.resolve(import.meta.dirname, "../..");

const listJsonAssets = (root: string): string[] =>
  fs
    .readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)).replaceAll("\\", "/"))
    .toSorted();

test("the built package includes every locale asset", () => {
  const sourceLocaleRoot = path.join(PACKAGE_ROOT, "src/locales");
  const builtLocaleRoot = path.join(PACKAGE_ROOT, "dist/locales");

  assert.equal(fs.existsSync(builtLocaleRoot), true, "expected dist/locales to be created by the package build");
  assert.deepEqual(listJsonAssets(builtLocaleRoot), listJsonAssets(sourceLocaleRoot));
});

test("the built entry resolves dynamic locale imports inside dist", () => {
  const builtEntry = fs.readFileSync(path.join(PACKAGE_ROOT, "dist/index.js"), "utf8");

  assert.match(builtEntry, /import\(`\.\/locales\/\$\{[^}]+\}\/\$\{[^}]+\}\.json`\)/);
});
