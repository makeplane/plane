/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { createInstance } from "i18next";
import { createRequire } from "node:module";
import type ICUType from "i18next-icu";

// Node ESM needs the CJS adapter; the application bundler handles this interop.
const ICU = createRequire(import.meta.url)("i18next-icu").default as typeof ICUType;

const localeRoot = fileURLToPath(new URL("../src/locales/", import.meta.url));

function flatten(value: Record<string, unknown>, prefix = "", result: Record<string, string> = {}) {
  for (const [key, entry] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (entry && typeof entry === "object") flatten(entry as Record<string, unknown>, path, result);
    else if (typeof entry === "string") result[path] = entry;
  }
  return result;
}

function readLocale(language: string) {
  return Object.assign(
    {},
    ...readdirSync(join(localeRoot, language))
      .filter((file) => file.endsWith(".json"))
      .map((file) => flatten(JSON.parse(readFileSync(join(localeRoot, language, file), "utf8"))))
  ) as Record<string, string>;
}

const en = readLocale("en");
const zh = readLocale("zh-CN");
const parameters = (text: string) => [...text.matchAll(/\{(\w+)(?:,|\})/g)].map((m) => m[1]).sort();

const webKeys = Object.keys(en).filter((key) => key.startsWith("web_ui."));

test("web and editor references resolve to real translation strings", () => {
  const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
  function inspect(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!["node_modules", "build", "dist", ".react-router", ".turbo"].includes(entry.name)) inspect(path);
      } else if (/\.tsx?$/.test(entry.name)) {
        for (const match of readFileSync(path, "utf8").matchAll(/["'](web_ui\.[\w]+)["']/g)) {
          assert.ok(match[1] in en && match[1] in zh, `${path}: ${match[1]}`);
        }
      }
    }
  }
  inspect(join(repositoryRoot, "apps/web"));
  inspect(join(repositoryRoot, "packages/editor/src"));
});

async function createTranslator(language = "zh-CN") {
  const instance = createInstance().use(ICU);
  await instance.init({
    lng: language,
    fallbackLng: "en",
    keySeparator: false,
    i18nFormat: {
      parseErrorHandler: (error: Error) => {
        throw error;
      },
    },
    resources: { en: { translation: en }, "zh-CN": { translation: zh } },
  });
  return instance;
}

test("Simplified Chinese covers the English keys and preserves UI interpolation parameters", () => {
  for (const key of Object.keys(en)) assert.ok(key in zh, `Missing Chinese translation: ${key}`);
  for (const key of webKeys) {
    assert.ok(zh[key].trim(), `Empty Chinese translation: ${key}`);

    assert.deepEqual(parameters(zh[key]), parameters(en[key]), `Changed parameters: ${key}`);
  }
});

test("all added messages format in both languages without leaking markup or placeholders", async () => {
  const instance = await createTranslator();
  for (const language of ["zh-CN", "en"]) {
    for (const key of webKeys) {
      const params = Object.fromEntries([...en[key].matchAll(/\{(\w+)(?:,|\})/g)].map((m) => [m[1], "示例"]));
      const result = instance.t(key, { ...params, lng: language });
      assert.equal(typeof result, "string", key);
      assert.ok(!/\{value\d+\}|&(?:nbsp|apos|amp);/.test(result), `${key}: ${result}`);
    }
  }
});

test("member names are preserved and language switching changes the surrounding message", async () => {
  const instance = await createTranslator();
  const name = "小王 / O'Neil {team}";
  assert.equal(instance.t("web_ui.remove_member_title", { name }), `移除 ${name}？`);
  await instance.changeLanguage("en");
  assert.equal(instance.t("web_ui.remove_member_title", { name }), `Remove ${name}?`);
});

test("zero, singular and plural work-item counts retain the correct English and Chinese copy", async () => {
  const instance = await createTranslator();
  const key = "web_ui.dynamic_there_are_value0_value1_in_this_cycle";
  for (const count of [0, 1, 2]) {
    assert.equal(instance.t(key, { lng: "zh-CN", value0: count, value1: "工作项" }), `此周期中有 ${count} 个工作项`);

    const noun = count > 1 ? "work items" : "work item";
    assert.equal(
      instance.t(key, { lng: "en", value0: count, value1: noun }),
      `There are ${count} ${noun} in this cycle`
    );
  }
});

test("frontend error messages switch language without changing the language fallback", async () => {
  const instance = await createTranslator();
  assert.equal(instance.t("web_ui.failed_to_update_timezone"), "时区更新失败");
  await instance.changeLanguage("en");
  assert.equal(instance.t("web_ui.failed_to_update_timezone"), "Failed to update timezone");
  assert.deepEqual(instance.options.fallbackLng, ["en"]);
});
