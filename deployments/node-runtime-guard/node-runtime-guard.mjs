/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Build-time guard for the Node.js runtime used by the Plane Docker images.
//
// CVE-2026-111497 ("Node2Shell") is an out-of-bounds write in the Brotli
// decoder bundled inside Node.js. The 22.x line is fixed in 22.23.4. This guard
// fails the Docker build when the base image ships an older Node release, so a
// rebuild can never silently fall back to a vulnerable runtime.
//
// Usage:
//   node node-runtime-guard.mjs                     release guard only
//   node node-runtime-guard.mjs --brotli-roundtrip  release guard + native Brotli smoke test
//
// Notes:
// - `process.versions.brotli` may still report 1.1.0 after the backported fix,
//   so it is logged for inventory but never used as a pass/fail signal.
// - The roundtrip is a smoke test that the native decoder loads and works; it is
//   not an exploit regression test and does not prove the CVE patch on its own.
//   Patch provenance comes from the official Node release + pinned image digest.

import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, brotliDecompressSync, constants } from "node:zlib";

/** Docker toolchain policy: the images stay on the Node 22 line. */
export const REQUIRED_MAJOR = 22;
/** First Node 22 release containing the CVE-2026-111497 fix. */
export const MIN_PATCHED_VERSION = "22.23.4";

/**
 * @param {string} version e.g. "v22.23.4" or "22.23.4"
 * @returns {[number, number, number]}
 */
export function parseVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(version).trim());
  if (!match) throw new Error(`Unrecognised Node.js version string: ${JSON.stringify(version)}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * @param {string} version
 * @returns {{ ok: boolean, reason: string }}
 */
export function checkNodeRelease(version) {
  const current = parseVersion(version);
  const minimum = parseVersion(MIN_PATCHED_VERSION);

  if (current[0] !== REQUIRED_MAJOR) {
    return {
      ok: false,
      reason:
        `Node ${current.join(".")} is outside the Docker toolchain policy (Node ${REQUIRED_MAJOR}.x only). ` +
        "This is a toolchain policy decision, not a verdict that this release is vulnerable.",
    };
  }

  for (let i = 0; i < 3; i += 1) {
    if (current[i] > minimum[i]) break;
    if (current[i] < minimum[i]) {
      return {
        ok: false,
        reason: `Node ${current.join(".")} is older than ${MIN_PATCHED_VERSION} and is affected by CVE-2026-111497 (Brotli decoder).`,
      };
    }
  }

  return { ok: true, reason: `Node ${current.join(".")} >= ${MIN_PATCHED_VERSION}` };
}

/** Deterministic, compressible fixture (~6 KiB). */
export function brotliFixture() {
  const line = "plane:cve-2026-111497:brotli-roundtrip-fixture:0123456789abcdef\n";
  return Buffer.from(line.repeat(96), "utf8");
}

/**
 * Compress and decompress the fixture with the native zlib Brotli bindings.
 * @returns {{ ok: boolean, inputBytes: number, compressedBytes: number, sha256: string }}
 */
export function brotliRoundtrip() {
  const fixture = brotliFixture();
  const compressed = brotliCompressSync(fixture, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  });
  const restored = brotliDecompressSync(compressed);
  return {
    ok: restored.equals(fixture) && compressed.length < fixture.length,
    inputBytes: fixture.length,
    compressedBytes: compressed.length,
    sha256: createHash("sha256").update(restored).digest("hex"),
  };
}

function isMain() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

function main(argv) {
  const runRoundtrip = argv.includes("--brotli-roundtrip");
  const inventory = { node: process.version, brotli: process.versions.brotli ?? null };
  console.log(`[node-runtime-guard] ${JSON.stringify(inventory)}`);

  const release = checkNodeRelease(process.version);
  if (!release.ok) {
    console.error(`[node-runtime-guard] FAIL: ${release.reason}`);
    return 1;
  }
  console.log(`[node-runtime-guard] release OK: ${release.reason}`);

  if (runRoundtrip) {
    const result = brotliRoundtrip();
    if (!result.ok) {
      console.error(`[node-runtime-guard] FAIL: Brotli roundtrip mismatch ${JSON.stringify(result)}`);
      return 1;
    }
    console.log(`[node-runtime-guard] brotli roundtrip OK ${JSON.stringify(result)}`);
  }
  return 0;
}

if (isMain()) {
  process.exitCode = main(process.argv.slice(2));
}
