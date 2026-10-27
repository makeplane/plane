/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Regression tests for the CVE-2026-111497 Node runtime guard and the static
// Node base-image pinning in the production Dockerfiles.
//
// Run from the repository root:  node --test deployments/node-runtime-guard/node-runtime-guard.test.mjs

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  MIN_PATCHED_VERSION,
  brotliRoundtrip,
  checkNodeRelease,
  parseVersion,
} from "./node-runtime-guard.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const GUARD = join(HERE, "node-runtime-guard.mjs");

const PINNED_NODE_IMAGE =
  "node:22.23.4-alpine3.24@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914";
const GUARD_IN_IMAGE = "/opt/plane/node-runtime-guard.mjs";

/** Production Dockerfiles in scope. `runtime: true` => Node is the final runtime. */
const DOCKERFILES = [
  { path: "apps/space/Dockerfile.space", runtime: true },
  { path: "apps/live/Dockerfile.live", runtime: true },
  { path: "apps/web/Dockerfile.web", runtime: false },
  { path: "apps/admin/Dockerfile.admin", runtime: false },
];

describe("checkNodeRelease", () => {
  it("pins the minimum patched release", () => {
    assert.equal(MIN_PATCHED_VERSION, "22.23.4");
  });

  for (const version of ["v22.23.3", "22.23.3", "v22.23.0", "v22.22.0", "v22.0.0", "v22.9.99"]) {
    it(`rejects vulnerable 22.x release ${version}`, () => {
      const result = checkNodeRelease(version);
      assert.equal(result.ok, false);
      assert.match(result.reason, /CVE-2026-111497/);
    });
  }

  for (const version of ["v22.23.4", "22.23.4", "v22.23.5", "v22.24.0", "v22.30.1"]) {
    it(`accepts patched 22.x release ${version}`, () => {
      assert.equal(checkNodeRelease(version).ok, true);
    });
  }

  for (const version of ["v20.20.0", "v24.22.1", "v26.12.1", "v23.0.0"]) {
    it(`rejects other major ${version} as toolchain policy, not as a vulnerability verdict`, () => {
      const result = checkNodeRelease(version);
      assert.equal(result.ok, false);
      assert.match(result.reason, /toolchain policy/);
      assert.doesNotMatch(result.reason, /CVE-2026-111497/);
    });
  }

  for (const version of ["", "22", "22.23", "v22.23.4-rc.1", "latest", "lts/jod"]) {
    it(`throws on unparsable version ${JSON.stringify(version)}`, () => {
      assert.throws(() => parseVersion(version));
    });
  }
});

describe("brotliRoundtrip", () => {
  it("restores the fixture byte-for-byte", () => {
    const result = brotliRoundtrip();
    assert.equal(result.ok, true);
    assert.equal(result.inputBytes, 6144);
    assert.equal(result.sha256, "746e1096de5d6bf1fee599fc89ce5039cf0b3f636d4e4e14414a75d3273e03a6");
  });
});

describe("guard CLI on the current runtime", () => {
  const expectedOk = checkNodeRelease(process.version).ok;

  it(`exits ${expectedOk ? 0 : 1} for ${process.version} and logs the inventory line`, () => {
    const run = spawnSync(process.execPath, [GUARD, "--brotli-roundtrip"], { encoding: "utf8" });
    assert.equal(run.status, expectedOk ? 0 : 1, run.stderr);
    assert.match(run.stdout, /\[node-runtime-guard\] \{"node":"v\d+\.\d+\.\d+","brotli":/);
    if (expectedOk) assert.match(run.stdout, /brotli roundtrip OK/);
  });
});

describe("Dockerfile Node base pinning", () => {
  for (const { path, runtime } of DOCKERFILES) {
    describe(path, () => {
      const source = readFileSync(join(REPO_ROOT, path), "utf8");
      const lines = source.split("\n");
      const instructions = lines.map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

      it("uses exactly one Node base, pinned by tag and digest", () => {
        const nodeFroms = instructions.filter((l) => /^FROM\s+(\S+\/)?node:/i.test(l));
        assert.deepEqual(nodeFroms, [`FROM ${PINNED_NODE_IMAGE} AS base`]);
      });

      it("has no floating node tags", () => {
        assert.doesNotMatch(source, /node:22-alpine\b/);
        assert.doesNotMatch(source, /node:\d+(-alpine)?\s/);
      });

      it("runs every other Node stage FROM base", () => {
        const fromLines = instructions.filter((l) => /^FROM\s/i.test(l));
        for (const line of fromLines) {
          if (line.includes(PINNED_NODE_IMAGE)) continue;
          assert.match(line, /^FROM\s+(base\s|caddy:)/i, `unexpected stage: ${line}`);
        }
      });

      it("runs the release guard in the base stage", () => {
        const baseEnd = instructions.findIndex((l, i) => i > 0 && /^FROM\s/i.test(l));
        const baseStage = instructions.slice(0, baseEnd);
        assert.ok(baseStage.includes(`COPY deployments/node-runtime-guard/node-runtime-guard.mjs ${GUARD_IN_IMAGE}`));
        assert.ok(baseStage.includes(`RUN node ${GUARD_IN_IMAGE}`));
      });

      if (runtime) {
        it("re-runs the guard with the Brotli roundtrip as the last RUN of the final stage", () => {
          const lastFrom = instructions.findLastIndex((l) => /^FROM\s/i.test(l));
          assert.match(instructions[lastFrom], /^FROM\s+base\s+AS\s+runner$/i);
          const runs = instructions.slice(lastFrom).filter((l) => /^RUN\s/i.test(l));
          assert.equal(runs.at(-1), `RUN node ${GUARD_IN_IMAGE} --brotli-roundtrip`);
        });
      } else {
        it("keeps the final stage on Caddy (no Node runtime shipped)", () => {
          const lastFrom = instructions.findLast((l) => /^FROM\s/i.test(l));
          assert.match(lastFrom, /^FROM\s+caddy:/i);
        });
      }
    });
  }
});
