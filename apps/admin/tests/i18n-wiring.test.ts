/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

test("God Mode uses the shared Plane translation runtime", () => {
  const packageJson = JSON.parse(read("apps/admin/package.json")) as {
    dependencies?: Record<string, string>;
  };
  const coreProviders = read("apps/admin/providers/core.tsx");
  const translationProvider = read("apps/admin/providers/translation-provider.tsx");

  assert.equal(packageJson.dependencies?.["@plane/i18n"], "workspace:*");
  assert.match(coreProviders, /AdminTranslationProvider/);
  assert.match(translationProvider, /TranslationProvider/);
  assert.match(translationProvider, /useTranslation/);
});

test("God Mode synchronizes the document language after translations initialize", () => {
  const translationProvider = read("apps/admin/providers/translation-provider.tsx");

  assert.match(translationProvider, /document\.documentElement\.lang\s*=\s*currentLocale/);
});

test("God Mode breadcrumb segments resolve existing shared translation keys", () => {
  const labels = read("apps/admin/components/common/header/core.ts");
  const header = read("apps/admin/components/common/header/index.tsx");

  assert.match(labels, /general:\s*"common\.general"/);
  assert.match(labels, /authentication:\s*"workspace_settings\.settings\.members\.details\.authentication"/);
  assert.match(labels, /workspace:\s*"common\.workspace"/);
  assert.match(labels, /create:\s*"common\.create"/);
  assert.match(header, /useTranslation/);
  assert.match(header, /t\(translationKey\)/);
  assert.match(header, /t\("settings"\)/);
});

test("God Mode does not add an English-placeholder Admin namespace", () => {
  const localesRoot = path.join(REPO_ROOT, "packages/i18n/src/locales");
  const unexpected = fs
    .readdirSync(localesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(localesRoot, entry.name, "admin.json"))
    .filter((localeFile) => fs.existsSync(localeFile));

  assert.deepEqual(unexpected, []);
});

test("God Mode reuses shared translations for common fields and actions", () => {
  const signIn = read("apps/admin/app/(all)/(home)/sign-in-form.tsx");
  const setup = read("apps/admin/components/instance/setup-form.tsx");
  const general = read("apps/admin/app/(all)/(dashboard)/general/form.tsx");
  const newUserPopup = read("apps/admin/components/common/new-user-popup.tsx");

  assert.match(signIn, /t\("auth\.common\.email\.label"\)/);
  assert.match(signIn, /t\("auth\.common\.password\.label"\)/);
  assert.match(setup, /t\("first_name"\)/);
  assert.match(setup, /t\("last_name"\)/);
  assert.match(setup, /t\("common\.continue"\)/);
  assert.match(general, /t\("save_changes"\)/);
  assert.match(general, /t\("saving"\)/);
  assert.match(newUserPopup, /t\("create_workspace"\)/);
  assert.match(newUserPopup, /t\("close"\)/);

  const importantSurfaceClassCount = [signIn, setup].reduce(
    (count, source) => count + (source.match(/\bbg-surface-1!/g)?.length ?? 0),
    0
  );
  assert.equal(importantSurfaceClassCount, 8);
  assert.doesNotMatch(signIn, /!bg-surface-1/);
  assert.doesNotMatch(setup, /!bg-surface-1/);
  assert.match(newUserPopup, /Start your journey by creating your first workspace\./);
});
