/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Usage:
//   tsx packages/i18n/scripts/hardcoded-check.ts                            # Report by package
//   tsx packages/i18n/scripts/hardcoded-check.ts --ci                       # Exit 1 if any file exceeds its baseline
//   tsx packages/i18n/scripts/hardcoded-check.ts --ci --base <ref>          # Same; show strings new since <ref> (default origin/preview)
//   tsx packages/i18n/scripts/hardcoded-check.ts --update                   # Rewrite baseline (counts may only shrink)
//   tsx packages/i18n/scripts/hardcoded-check.ts --update --allow-increase  # Rewrite baseline, allowing increases

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { Counts, Hit } from "./lib/hardcoded.js";
import {
  compareToBaseline,
  findBlockedIncreases,
  findNewHits,
  findRegressions,
  isScannedFile,
  scanSource,
} from "./lib/hardcoded.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const BASELINE_PATH = path.resolve(import.meta.dirname, "../hardcoded-baseline.json");
const BASELINE_REL = path.relative(REPO_ROOT, BASELINE_PATH);

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function scanRepo(): Hit[] {
  // -z keeps non-ASCII paths unquoted; existsSync skips tracked files deleted in the working tree.
  const files = execFileSync("git", ["ls-files", "-z", "apps", "packages"], { cwd: REPO_ROOT, maxBuffer: 1e9 })
    .toString()
    .split("\0")
    .filter((file) => isScannedFile(file) && fs.existsSync(path.join(REPO_ROOT, file)));
  return files.flatMap((file) => scanSource(file, fs.readFileSync(path.join(REPO_ROOT, file), "utf-8")));
}

/** Run git in the repo root; null when it fails (unknown ref, file missing at that commit). */
function gitOrNull(gitArgs: string[]): string | null {
  try {
    return execFileSync("git", gitArgs, {
      cwd: REPO_ROOT,
      maxBuffer: 1e9,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();
  } catch {
    return null;
  }
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
  const argv = process.argv.slice(2);
  const args = new Set(argv);
  const hits = scanRepo();
  const current = countByFile(hits);
  const baseline = readBaseline();
  const regressions = findRegressions(baseline, current);

  if (args.has("--update")) {
    const blocked = findBlockedIncreases(baseline, current);
    if (blocked.length > 0 && !args.has("--allow-increase")) {
      console.error(`Refusing to raise baseline counts for ${blocked.length} file(s):`);
      for (const r of blocked) console.error(`  ${r.file}: ${r.baseline} -> ${r.current}`);
      console.error("Remove the new strings, or pass --allow-increase if this is intentional.");
      process.exit(1);
    }
    writeBaseline(current);
    console.log(`Wrote ${BASELINE_REL}: ${fmt(hits.length)} hits in ${fmt(Object.keys(current).length)} files.`);
    return;
  }

  if (args.has("--ci")) {
    const baseIndex = argv.indexOf("--base");
    const baseRef = (baseIndex >= 0 ? argv[baseIndex + 1] : undefined) ?? "origin/preview";
    const mergeBase = gitOrNull(["merge-base", baseRef, "HEAD"])?.trim();
    // Only files this change touches are enforced, so drift elsewhere on the base branch never fails
    // unrelated PRs. --no-renames lists both sides of a rename. Without a base, every file is enforced.
    const changedOutput = mergeBase ? gitOrNull(["diff", "--name-only", "--no-renames", "-z", mergeBase]) : null;
    const changed = changedOutput === null ? null : new Set(changedOutput.split("\0").filter(Boolean));
    if (!changed) console.error(`Could not diff against ${baseRef}; checking every file.\n`);
    const { regressions: scoped, stale } = compareToBaseline(baseline, current, changed);
    if (scoped.length === 0 && stale.length === 0) {
      const scope = changed ? `${fmt(changed.size)} changed file(s)` : "all files";
      console.log(`Hardcoded string check passed for ${scope}: none above baseline.`);
      return;
    }
    if (scoped.length === 0) {
      // A stale baseline would let removed strings come back, so it must be lowered in the same PR.
      console.error(`${stale.length} file(s) are below their baseline:`);
      for (const f of stale) console.error(`  ${f}: ${baseline[f]} -> ${current[f] ?? 0}`);
      console.error("Run `pnpm --filter=@plane/i18n hardcoded:update` and commit the baseline.");
      process.exit(1);
    }
    console.error(`New hardcoded user-facing strings in ${scoped.length} file(s).\n`);
    for (const r of scoped) {
      const fileHits = hits.filter((h) => h.file === r.file);
      const baseSource = mergeBase ? gitOrNull(["show", `${mergeBase}:${r.file}`]) : null;
      const newHits = mergeBase ? findNewHits(baseSource ? scanSource(r.file, baseSource) : [], fileHits) : [];
      // Nothing identifiable as new (e.g. a string reworded in place): fall back to the full list.
      const shown = newHits.length > 0 ? newHits : fileHits;
      const label = newHits.length > 0 ? `new since ${baseRef}` : "all strings in file";
      console.error(`${r.file} (baseline ${r.baseline}, now ${r.current}; ${label}):`);
      for (const hit of shown) console.error(`  ${hit.file}:${hit.line}  ${JSON.stringify(hit.text)}`);
      console.error("");
    }
    console.error(
      "Move these strings to packages/i18n/src/locales and use t(), or add `// i18n-ignore: <reason>` " +
        "on the same or previous line when the string must not be translated. If you only renamed or moved " +
        "a file, run `pnpm --filter=@plane/i18n hardcoded:update` and commit the baseline."
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
