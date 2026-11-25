/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Usage:
//   tsx packages/i18n/scripts/hardcoded-check.ts                    # Report hardcoded strings by package
//   tsx packages/i18n/scripts/hardcoded-check.ts --ci               # Exit 1 if this change adds hardcoded strings
//   tsx packages/i18n/scripts/hardcoded-check.ts --ci --base <ref>  # Compare against <ref> (default origin/preview)

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { Hit } from "./lib/hardcoded.js";
import { findNewHits, isScannedFile, scanSource } from "./lib/hardcoded.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: REPO_ROOT, maxBuffer: 1e9, stdio: ["ignore", "pipe", "pipe"] }).toString();
}

function readWorkingFile(file: string): string | null {
  const full = path.join(REPO_ROOT, file);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf-8") : null;
}

function report(): void {
  // -z keeps non-ASCII paths unquoted.
  const files = git(["ls-files", "-z", "apps", "packages"]).split("\0").filter(isScannedFile);
  const hits = files.flatMap((file) => {
    const source = readWorkingFile(file);
    return source === null ? [] : scanSource(file, source);
  });
  const byPackage = new Map<string, number>();
  for (const hit of hits) {
    const pkg = hit.file.split("/").slice(0, 2).join("/");
    byPackage.set(pkg, (byPackage.get(pkg) ?? 0) + 1);
  }
  const fileCount = new Set(hits.map((h) => h.file)).size;
  console.log(`Hardcoded user-facing strings: ${fmt(hits.length)} in ${fmt(fileCount)} files\n`);
  for (const [pkg, n] of [...byPackage].toSorted((a, b) => b[1] - a[1])) {
    console.log(`  ${fmt(n).padStart(6)}  ${pkg}`);
  }
}

/**
 * Fails only on strings this change adds. All changed files are compared as one set against their
 * versions at the merge base, so a string that only moved between files (rename, extract, flatten)
 * cancels out. Git errors fail open: a CI hiccup must never block a PR.
 */
function ci(baseRef: string): void {
  let baseHits: Hit[] = [];
  let headHits: Hit[] = [];
  try {
    const mergeBase = git(["merge-base", baseRef, "HEAD"]).trim();
    // --no-renames lists a rename as delete + add, so both sides are scanned.
    const entries = git(["diff", "--name-status", "--no-renames", "-z", mergeBase]).split("\0").filter(Boolean);
    for (let i = 0; i + 1 < entries.length; i += 2) {
      const [status, file] = [entries[i], entries[i + 1]];
      if (!isScannedFile(file)) continue;
      if (status !== "A") baseHits = baseHits.concat(scanSource(file, git(["show", `${mergeBase}:${file}`])));
      const head = readWorkingFile(file);
      if (head !== null) headHits = headHits.concat(scanSource(file, head));
    }
  } catch (error) {
    console.warn(`Skipping hardcoded string check: could not compare against ${baseRef}.`);
    console.warn(error instanceof Error ? error.message : error);
    return;
  }

  const added = findNewHits(baseHits, headHits);
  if (added.length === 0) {
    console.log(`Hardcoded string check passed: no new hardcoded strings since ${baseRef}.`);
    return;
  }
  console.error(`${added.length} new hardcoded user-facing string(s) since ${baseRef}:\n`);
  for (const hit of added) console.error(`  ${hit.file}:${hit.line}  ${JSON.stringify(hit.text)}`);
  console.error(
    "\nMove these strings to packages/i18n/src/locales and use t(), or add `// i18n-ignore: <reason>` " +
      "on the same line or on a comment-only line above when the string must not be translated."
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
if (argv.includes("--ci")) {
  const baseIndex = argv.indexOf("--base");
  ci((baseIndex >= 0 ? argv[baseIndex + 1] : undefined) ?? "origin/preview");
} else {
  report();
}
