/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Usage: node scripts/generate-resources.mjs
// Reads:  src/locales/*/*.json
// Writes: src/locales/resources.generated.ts
//
// Emits a single static module with every locale's namespaces embedded as
// JSON. The i18n runtime resolves translations from this module, so it works
// with any bundler (Vite/Rollup, webpack, tsdown) and needs no runtime
// network access — unlike a template-literal dynamic import, which Vite
// cannot statically analyze and which 404s at runtime.

import fs from "node:fs";
import path from "node:path";

const COPYRIGHT_HEADER = `/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */`;

const rootDir = path.resolve(import.meta.dirname, "..");
const localesDir = path.join(rootDir, "src", "locales");
const outputFile = path.join(localesDir, "resources.generated.ts");

if (!fs.existsSync(localesDir)) {
  console.error(`Error: Locales directory not found: ${localesDir}`);
  process.exit(1);
}

const languages = fs
  .readdirSync(localesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (languages.length === 0) {
  console.error(`Error: No locale directories found in ${localesDir}`);
  process.exit(1);
}

const fileCounts = [];
const lines = [
  COPYRIGHT_HEADER,
  "",
  "// AUTO-GENERATED — DO NOT EDIT",
  "// Generated from all locale JSON files. Run: pnpm run generate:resources",
  "",
  "export type TGeneratedResources = Record<string, Record<string, Record<string, unknown>>>;",
  "",
  "export const GENERATED_RESOURCES: TGeneratedResources = {",
];

for (const language of languages) {
  const localeDir = path.join(localesDir, language);
  const jsonFiles = fs
    .readdirSync(localeDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  if (jsonFiles.length === 0) {
    console.error(`Error: No JSON files found in ${localeDir}`);
    process.exit(1);
  }

  const bundle = {};
  for (const file of jsonFiles) {
    const filePath = path.join(localeDir, file);
    const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
    try {
      bundle[path.basename(file, ".json")] = JSON.parse(raw);
    } catch (err) {
      console.error(`Error: Failed to parse JSON in ${filePath}: ${err.message}`);
      process.exit(1);
    }
  }

  // JSON.stringify(bundle) is the raw JSON text of the locale; the outer
  // JSON.stringify wraps it into a fully escaped JS string literal (escapes
  // quotes, backslashes, control chars). JSON.parse at runtime reverses it.
  // No "as" cast is needed — JSON.parse returns "any", assignable to the
  // typed const.
  lines.push(`  "${language}": JSON.parse(${JSON.stringify(JSON.stringify(bundle))}),`);
  fileCounts.push(`${language}: ${jsonFiles.length}`);
}

lines.push("};", "");
lines.push(`// Generated from ${languages.length} locales: ${fileCounts.join(", ")}`, "");

fs.writeFileSync(outputFile, lines.join("\n"), "utf-8");
console.log(`Generated ${outputFile} (${languages.length} locales, ${fileCounts.reduce((sum, f) => sum + Number(f.split(": ")[1]), 0)} namespace files)`);
