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

test("project insight labels use stable API keys instead of backend English names", () => {
  const component = read("apps/web/core/components/analytics/overview/project-insights.tsx");
  const api = read("apps/api/plane/app/views/analytic/advance.py");
  const commonLocale = JSON.parse(read("packages/i18n/src/locales/en/common.json"));
  const apiDataBlock = api.match(/data\s*=\s*\{([\s\S]*?)\n\s*\}/)?.[1];

  assert.ok(apiDataBlock, "expected the project chart API data mapping");

  const apiKeys = [...apiDataBlock.matchAll(/^\s*"([a-z_]+)":/gm)].map((match) => match[1]);
  const labelMapBlock = component.match(/PROJECT_INSIGHT_LABEL_KEYS[^=]*=\s*\{([\s\S]*?)\n\};/)?.[1];

  assert.ok(labelMapBlock, "expected a frontend translation-key map for project insight dimensions");
  for (const key of apiKeys) {
    const translationKey = labelMapBlock.match(new RegExp(`${key}:\\s*"([^"]+)"`))?.[1];
    assert.ok(translationKey, `expected a translation key for ${key}`);

    const value = translationKey.split(".").reduce<unknown>((node, segment) => {
      if (!node || typeof node !== "object") return undefined;
      return (node as Record<string, unknown>)[segment];
    }, commonLocale);
    assert.equal(typeof value, "string", `expected ${translationKey} to resolve to a leaf string`);
  }

  assert.match(component, /data=\{localizedProjectInsightsData\}/);
  assert.doesNotMatch(component, /data=\{projectInsightsData\}/);
  assert.match(component, /\{localizedProjectInsightsData\?\.map\(\(item\) => \(/);
  assert.doesNotMatch(component, /\{projectInsightsData(?:\?\.|\.)map\(\(item\) => \(/);
});
