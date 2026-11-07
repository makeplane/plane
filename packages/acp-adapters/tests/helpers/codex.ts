/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { PACKAGE_ROOT, tempDir } from "./client.ts";

export const FAKE_CODEX = path.join(PACKAGE_ROOT, "tests/helpers/fake-codex.cjs");

/** A PATH directory whose `codex` is the fake app-server, plus the log file it writes. */
export function fakeCodexEnv(extra: NodeJS.ProcessEnv = {}): {
  env: NodeJS.ProcessEnv;
  log: () => Record<string, unknown>[];
} {
  const dir = tempDir("fake-codex-");
  const shim = path.join(dir, "codex");
  writeFileSync(shim, `#!/bin/sh\nexec "${process.execPath}" "${FAKE_CODEX}" "$@"\n`);
  chmodSync(shim, 0o755);
  const logFile = path.join(dir, "log.jsonl");
  return {
    env: {
      PATH: `${dir}${path.delimiter}${process.env.PATH ?? ""}`,
      HOME: tempDir("codex-home-"),
      FAKE_CODEX_LOG: logFile,
      PLANE_AGENT_AUTH: "",
      CODEX_HOME: "",
      OPENAI_API_KEY: "",
      ...extra,
    },
    log: () =>
      existsSync(logFile)
        ? readFileSync(logFile, "utf8")
            .split("\n")
            .filter(Boolean)
            .map((line) => JSON.parse(line) as Record<string, unknown>)
        : [],
  };
}
