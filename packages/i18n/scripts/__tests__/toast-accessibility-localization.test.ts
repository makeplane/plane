/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const REPOSITORY_ROOT = path.resolve(import.meta.dirname, "../../../..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(REPOSITORY_ROOT, relativePath), "utf8");
}

test("toast controls use existing translations for accessibility labels", () => {
  const source = read("packages/propel/src/toast/toast.tsx");
  const manifest = JSON.parse(read("packages/propel/package.json"));

  assert.match(source, /import\s+\{\s*useTranslation\s*\}\s+from\s+"@plane\/i18n"/);
  assert.match(source, /<BaseToast\.Viewport[^>]*aria-label=\{t\("notifications"\)\}/s);
  assert.match(source, /<BaseToast\.Close[^>]*aria-label=\{t\("close"\)\}/s);
  assert.equal(manifest.dependencies["@plane/i18n"], "workspace:*");
});
