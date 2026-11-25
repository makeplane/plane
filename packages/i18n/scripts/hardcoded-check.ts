/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Usage:
//   tsx packages/i18n/scripts/hardcoded-check.ts                            # Report by package
//   tsx packages/i18n/scripts/hardcoded-check.ts --ci                       # Exit 1 if any file exceeds its baseline
//   tsx packages/i18n/scripts/hardcoded-check.ts --update                   # Rewrite baseline (counts may only shrink)
//   tsx packages/i18n/scripts/hardcoded-check.ts --update --allow-increase  # Rewrite baseline, allowing increases

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { Counts, Hit } from "./lib/hardcoded.js";
import { findRegressions, isScannedFile, scanSource } from "./lib/hardcoded.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const BASELINE_PATH = path.resolve(import.meta.dirname, "../hardcoded-baseline.json");
const BASELINE_REL = path.relative(REPO_ROOT, BASELINE_PATH);

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function scanRepo(): Hit[] {
  const files = execFileSync("git", ["ls-files", "apps", "packages"], { cwd: REPO_ROOT, maxBuffer: 1e9 })
    .toString()
    .split("\n")
    .filter(isScannedFile);
  return files.flatMap((file) => scanSource(file, fs.readFileSync(path.join(REPO_ROOT, file), "utf-8")));
}

function countByFile(hits: Hit[]): Counts {
  const counts: Counts = {};
  for (const hit of hits) counts[hit.file] = (counts[hit.file] ?? 0) + 1;
  return counts;
}

function readBaseline(): Counts {
  if (!fs.existsSync(BASELINE_PATH)) return {};
  return JSON.parse(fs.readFileSync(BASELINE_PATH, "utf-8")) as Counts;
}

function writeBaseline(counts: Counts): void {
  const sorted = Object.fromEntries(Object.entries(counts).toSorted(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(sorted, null, 2) + "\n");
}

function main(): void {
  const args = new Set(process.argv.slice(2));
  const hits = scanRepo();
  const current = countByFile(hits);
  const baseline = readBaseline();
  const regressions = findRegressions(baseline, current);

  if (args.has("--update")) {
    if (regressions.length > 0 && !args.has("--allow-increase")) {
      console.error(`Refusing to raise baseline counts for ${regressions.length} file(s):`);
      for (const r of regressions) console.error(`  ${r.file}: ${r.baseline} -> ${r.current}`);
      console.error("Remove the new strings, or pass --allow-increase if this is intentional.");
      process.exit(1);
    }
    writeBaseline(current);
    console.log(`Wrote ${BASELINE_REL}: ${fmt(hits.length)} hits in ${fmt(Object.keys(current).length)} files.`);
    return;
  }

  if (args.has("--ci")) {
    if (regressions.length === 0) {
      const shrunk = Object.keys(baseline).filter((f) => (current[f] ?? 0) < baseline[f]).length;
      console.log(`Hardcoded string check passed: ${fmt(hits.length)} hits, none above baseline.`);
      if (shrunk > 0) {
        console.log(`${shrunk} file(s) are below their baseline. Run \`pnpm --filter=@plane/i18n hardcoded:update\`.`);
      }
      return;
    }
    console.error(`New hardcoded user-facing strings in ${regressions.length} file(s).\n`);
    for (const r of regressions) {
      console.error(`${r.file} (baseline ${r.baseline}, now ${r.current}):`);
      for (const hit of hits.filter((h) => h.file === r.file)) {
        console.error(`  ${hit.file}:${hit.line}  ${JSON.stringify(hit.text)}`);
      }
      console.error("");
    }
    console.error(
      "Move these strings to packages/i18n/src/locales and use t(), or add `// i18n-ignore: <reason>` " +
        "on the same or previous line when the string must not be translated."
    );
    process.exit(1);
  }

  const byPackage = new Map<string, number>();
  for (const hit of hits) {
    const pkg = hit.file.split("/").slice(0, 2).join("/");
    byPackage.set(pkg, (byPackage.get(pkg) ?? 0) + 1);
  }
  console.log(`Hardcoded user-facing strings: ${fmt(hits.length)} in ${fmt(Object.keys(current).length)} files\n`);
  for (const [pkg, n] of [...byPackage].toSorted((a, b) => b[1] - a[1])) {
    console.log(`  ${fmt(n).padStart(6)}  ${pkg}`);
  }
  if (regressions.length > 0) {
    console.log(`\n${regressions.length} file(s) above baseline. Run with --ci for details.`);
  }
}

main();
