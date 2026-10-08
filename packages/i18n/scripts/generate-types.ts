/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Usage: npx tsx packages/i18n/scripts/generate-types.ts
// Reads: src/locales/en/*.json
// Writes: src/types/keys.generated.ts

import fs from "node:fs";
import path from "node:path";

const COPYRIGHT_HEADER = `/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */`;

type NestedObject = { [key: string]: string | NestedObject };

/**
 * Recursively flatten a nested object into dot-notated keys.
 * Returns an array of flattened key strings.
 */
function flattenKeys(obj: NestedObject, prefix = ""): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      keys.push(fullKey);
    } else if (typeof value === "object" && value !== null) {
      keys.push(...flattenKeys(value as NestedObject, fullKey));
    }
  }

  return keys;
}

/**
 * Detect path conflicts where a key is both a leaf (string value) and a prefix
 * of another key. For example, "workspace" as a leaf and "workspace.settings" as
 * another key would be a conflict.
 */
function detectPathConflicts(keys: string[]): string[] {
  // Build a set of all prefixes used across keys
  const prefixes = new Set<string>();
  for (const key of keys) {
    const parts = key.split(".");
    for (let i = 1; i < parts.length; i++) {
      prefixes.add(parts.slice(0, i).join("."));
    }
  }

  // A conflict exists when a leaf key is also a prefix
  const conflicts: string[] = [];
  for (const key of keys) {
    if (prefixes.has(key)) {
      const extending = keys.find((k) => k.startsWith(key + "."));
      if (extending) {
        conflicts.push(`Path conflict: "${key}" is both a leaf key and a prefix of "${extending}"`);
      }
    }
  }

  return conflicts;
}

function main(): void {
  const rootDir = import.meta.dirname;
  const localesDir = path.resolve(rootDir, "..", "src", "locales", "en");
  const outputDir = path.resolve(rootDir, "..", "src", "types");
  const outputFile = path.join(outputDir, "keys.generated.ts");

  // Read all JSON files from the English locales directory
  if (!fs.existsSync(localesDir)) {
    console.error(`Error: Locales directory not found: ${localesDir}`);
    process.exit(1);
  }

  const jsonFiles = fs
    .readdirSync(localesDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  if (jsonFiles.length === 0) {
    console.error(`Error: No JSON files found in ${localesDir}`);
    process.exit(1);
  }

  // Track keys per namespace file for collision detection
  const keysByFile = new Map<string, string[]>();
  const allKeys = new Set<string>();
  const collisions: string[] = [];

  for (const file of jsonFiles) {
    const filePath = path.join(localesDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = (() => {
      try {
        return JSON.parse(content) as NestedObject;
      } catch {
        console.error(`Error: Failed to parse JSON in ${file}`);
        process.exit(1);
      }
    })();

    const fileKeys = flattenKeys(parsed);
    keysByFile.set(file, fileKeys);

    // Detect cross-namespace collisions
    for (const key of fileKeys) {
      if (allKeys.has(key)) {
        // Find which file already had this key
        for (const [otherFile, otherKeys] of keysByFile.entries()) {
          if (otherFile !== file && otherKeys.includes(key)) {
            collisions.push(`Cross-namespace collision: key "${key}" exists in both "${otherFile}" and "${file}"`);
          }
        }
      }
      allKeys.add(key);
    }
  }

  if (collisions.length > 0) {
    console.error("Error: Cross-namespace key collisions detected:");
    for (const collision of collisions) {
      console.error(`  ${collision}`);
    }
    process.exit(1);
  }

  // Detect path conflicts
  const sortedKeys = [...allKeys].sort();
  const pathConflicts = detectPathConflicts(sortedKeys);

  if (pathConflicts.length > 0) {
    console.error("Error: Path conflicts detected:");
    for (const conflict of pathConflicts) {
      console.error(`  ${conflict}`);
    }
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate the output file
  const keyLines = sortedKeys.map((key) => `  | "${key}"`).join("\n");
  const output = `${COPYRIGHT_HEADER}

// AUTO-GENERATED — DO NOT EDIT
// Generated from ${jsonFiles.length} English namespace files (${sortedKeys.length} keys)
// Run: pnpm run generate:types

export type TTranslationKeys =
${keyLines}
  ;
`;

  fs.writeFileSync(outputFile, output, "utf-8");

  console.log(`Generated ${sortedKeys.length} keys from ${jsonFiles.length} namespace files`);
}

main();
