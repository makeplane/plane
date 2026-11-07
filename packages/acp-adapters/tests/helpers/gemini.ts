/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { PACKAGE_ROOT, tempDir } from "./client.ts";

export const FAKE_GEMINI = path.join(PACKAGE_ROOT, "tests/helpers/fake-gemini.cjs");

export interface FakeGemini {
  readonly env: Record<string, string>;
  /** The agent's `HOME`. */
  readonly home: string;
  /** Everything the fake received; the first entry of each run is `{ start: { argv, pid, env } }`. */
  log(): Record<string, any>[];
  starts(): { argv: string[]; pid: number; env: Record<string, string>; secretNames: string[] }[];
}

/** A PATH directory whose `gemini` is the fake ACP agent, a private HOME and the log the fake writes. */
export function fakeGeminiEnv(extra: Record<string, string> = {}): FakeGemini {
  const dir = tempDir("fake-gemini-");
  const shim = path.join(dir, "gemini");
  writeFileSync(shim, `#!/bin/sh\nexec "${process.execPath}" "${FAKE_GEMINI}" "$@"\n`);
  chmodSync(shim, 0o755);
  const home = tempDir("gemini-home-");
  const logFile = path.join(dir, "log.jsonl");
  const log = () =>
    existsSync(logFile)
      ? readFileSync(logFile, "utf8")
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line) as Record<string, any>)
      : [];
  return {
    env: {
      PATH: `${dir}${path.delimiter}${process.env.PATH ?? ""}`,
      HOME: home,
      FAKE_GEMINI_LOG: logFile,
      PLANE_AGENT_AUTH: "",
      GEMINI_API_KEY: "",
      PLANE_AGENT_MODEL: "",
      ...extra,
    },
    home,
    log,
    starts: () => log().flatMap((entry) => (entry.start ? [entry.start] : [])),
  };
}
