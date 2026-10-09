#!/usr/bin/env node

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Repairs the `packages/i18n/locales` symlink.
 *
 * `packages/i18n/locales` is tracked in git as a symlink (mode 120000) pointing at
 * `src/locales`. The built bundle resolves translation resources relative to
 * `packages/i18n/dist`, so it needs `packages/i18n/locales` to be a directory:
 *
 *   resourcesToBackend((language, namespace) => import(`../locales/${language}/${namespace}.json`))
 *
 * On Windows git checks symlinks out as plain text files containing the link target
 * whenever `core.symlinks` is false (the default when the filesystem or the current
 * token cannot create symlinks). The link then becomes a regular file and every
 * namespace import fails, so the UI silently falls back to raw translation keys.
 *
 * This script recreates the link as a directory junction on Windows, which needs no
 * elevated privileges, and as a normal symlink elsewhere.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = path.resolve(PACKAGE_DIR, "..", "..");
const LINK_PATH = path.join(PACKAGE_DIR, "locales");
const TARGET_PATH = path.join(PACKAGE_DIR, "src", "locales");

const isWindows = process.platform === "win32";

const log = {
  ok: (message) => console.log(`\u2713 ${message}`),
  warn: (message) => console.warn(`! ${message}`),
  fail: (message) => console.error(`\u2717 ${message}`),
};

/**
 * Resolves through the link to decide whether it already works.
 *
 * A real symlink/junction resolves to a directory. Git's broken Windows checkout
 * resolves to a regular file, which is exactly the state we need to repair.
 */
const linkResolvesToDirectory = () => {
  try {
    return fs.statSync(LINK_PATH).isDirectory();
  } catch {
    return false;
  }
};

/** True when the path exists as a symlink or junction (already a working link). */
const isLink = () => {
  try {
    return fs.lstatSync(LINK_PATH).isSymbolicLink();
  } catch {
    return false;
  }
};

/** Describes what is currently sitting at the link path, for diagnostics. */
const describeCurrentState = () => {
  let stats;
  try {
    stats = fs.lstatSync(LINK_PATH);
  } catch {
    return "missing";
  }
  if (stats.isSymbolicLink()) return "symlink";
  if (stats.isDirectory()) return "directory";
  return `regular file (${stats.size} bytes)`;
};

const createLink = () => {
  // "junction" is honoured on Windows and ignored on other platforms, where Node
  // creates a regular symlink. Junctions do not require Developer Mode or admin.
  fs.symlinkSync(TARGET_PATH, LINK_PATH, isWindows ? "junction" : "dir");
};

const main = () => {
  if (!fs.existsSync(TARGET_PATH)) {
    log.fail(`Target directory not found: ${path.relative(REPO_ROOT, TARGET_PATH)}`);
    return 1;
  }

  if (linkResolvesToDirectory()) {
    log.ok(
      isLink()
        ? "packages/i18n/locales already links to src/locales"
        : "packages/i18n/locales already resolves to a directory"
    );
    return 0;
  }

  const before = describeCurrentState();
  log.warn(`packages/i18n/locales is broken (${before}); recreating it as a ${isWindows ? "junction" : "symlink"}`);

  try {
    fs.rmSync(LINK_PATH, { force: true, recursive: true });
    createLink();
  } catch (error) {
    log.fail(`Could not recreate packages/i18n/locales: ${error.message}`);
    console.error(
      [
        "",
        "  Fix it manually:",
        isWindows ? "    Remove-Item packages\\i18n\\locales" : "    rm packages/i18n/locales",
        isWindows
          ? "    cmd /c mklink /J packages\\i18n\\locales src\\locales"
          : "    ln -s src/locales packages/i18n/locales",
        "",
      ].join("\n")
    );
    return 1;
  }

  if (!linkResolvesToDirectory()) {
    log.fail("packages/i18n/locales still does not resolve to a directory after repair");
    return 1;
  }

  log.ok("packages/i18n/locales now links to src/locales");

  // Keep git from reporting the link as deleted, which would let a routine
  // `git commit -a` delete it for everyone (and break Linux/macOS CI).
  try {
    execFileSync("git", ["update-index", "--skip-worktree", "packages/i18n/locales"], {
      cwd: REPO_ROOT,
      stdio: "ignore",
    });
    log.ok("marked packages/i18n/locales as skip-worktree so git will not report it deleted");
  } catch {
    log.warn("could not set skip-worktree for packages/i18n/locales (not fatal)");
  }

  return 0;
};

process.exit(main());
