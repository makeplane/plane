/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createClaudeAdapter } from "../src/claude/index.ts";
import { PACKAGE_ROOT, tempDir } from "./helpers/client.ts";
import { fakeQuery } from "./helpers/claude.ts";
import { fakeCodexEnv } from "./helpers/codex.ts";
import { deepSeekServer } from "./helpers/deepseek.ts";
import { fakeGeminiEnv } from "./helpers/gemini.ts";
import { protocolViolations, runPipe, runScript, type GoldenCase, type RawRun } from "./helpers/golden.ts";
import { planeMcpServer } from "./helpers/mcp-server.ts";

/**
 * Golden transcripts, after employai_v2's conformance harness: each case's stdout must match its
 * recorded frames exactly, stdout must carry protocol frames only, and the corpus itself is pinned
 * (manifest hashes here, manifest hash in acp-version.lock.json) so it only changes on purpose.
 * Set UPDATE_GOLDEN=1 to re-record expected output and hashes, then review the diff.
 */
const GOLDEN = path.join(PACKAGE_ROOT, "tests/golden");
const MANIFEST = path.join(GOLDEN, "manifest.json");
const UPDATE = process.env.UPDATE_GOLDEN === "1";

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as { cases: GoldenCase[] } & Record<string, unknown>;
const sha256 = (data: Buffer | string) => createHash("sha256").update(data).digest("hex");

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [path.relative(GOLDEN, full)];
  });
}

describe("golden transcripts", () => {
  let api: Awaited<ReturnType<typeof deepSeekServer>>;
  let mcp: Awaited<ReturnType<typeof planeMcpServer>>;
  beforeAll(async () => {
    api = await deepSeekServer();
    mcp = await planeMcpServer();
  });
  afterAll(async () => {
    await api.close();
    await mcp.close();
    if (UPDATE) writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  });

  it("lists every fixture in the manifest, and nothing else", () => {
    const listed = new Set(manifest.cases.flatMap((entry) => [entry.input, entry.expected]));
    const onDisk = listFiles(GOLDEN).filter((file) => file !== "manifest.json");
    expect(onDisk.filter((file) => !listed.has(file))).toEqual([]);
    if (!UPDATE) expect([...listed].filter((file) => !onDisk.includes(file))).toEqual([]);
  });

  async function run(entry: GoldenCase, input: Buffer): Promise<RawRun> {
    const cwd = tempDir("golden-");
    const vars: Record<string, string> = { CWD: cwd, MCP_URL: mcp.url };
    if (entry.adapter === "claude") {
      const fake = fakeQuery();
      // In-process (the provider is mocked), so a pipe case is replayed as a script of sends.
      const script =
        entry.kind === "script"
          ? input.toString()
          : input
              .toString()
              .split("\n")
              .filter(Boolean)
              .map((line) => JSON.stringify({ send: JSON.parse(line) }))
              .join("\n");
      return runScript(
        { adapter: createClaudeAdapter({ query: fake.query as never }), env: { ANTHROPIC_API_KEY: "sk-ant-test" } },
        script,
        vars
      );
    }
    const env: Record<string, string> = { ...entry.env };
    if (entry.adapter === "codex") Object.assign(env, fakeCodexEnv().env);
    if (entry.adapter === "gemini") Object.assign(env, fakeGeminiEnv({ GEMINI_API_KEY: "AIza-golden" }).env);
    if (entry.adapter === "deepseek")
      Object.assign(env, { DEEPSEEK_API_KEY: "sk-deepseek", DEEPSEEK_BASE_URL: api.url });
    if (entry.kind === "script") return runScript({ bin: entry.adapter, env }, input.toString(), vars);
    return runPipe(entry.adapter, input, { env, ...(entry.splitAt ? { splitAt: entry.splitAt } : {}) });
  }

  for (const entry of manifest.cases) {
    it(entry.id, async () => {
      const input = readFileSync(path.join(GOLDEN, entry.input));
      if (!UPDATE) expect(sha256(input), `${entry.input} changed without re-recording`).toBe(entry.inputSha256);

      const result = await run(entry, input);
      const stdout = result.lines.map((line) => `${line}\n`).join("");
      expect(protocolViolations(result.lines)).toEqual([]);
      expect(result.exitCode).toBe(entry.exitCode);
      // stdout is the protocol; the agents themselves never write to stderr.
      expect(result.stderr).toBe("");

      const expectedFile = path.join(GOLDEN, entry.expected);
      if (UPDATE) {
        writeFileSync(expectedFile, stdout);
        Object.assign(entry, { inputSha256: sha256(input), expectedSha256: sha256(stdout) });
        return;
      }
      const expected = readFileSync(expectedFile, "utf8");
      expect(sha256(expected), `${entry.expected} changed without updating the manifest`).toBe(entry.expectedSha256);
      expect(result.lines).toEqual(expected.split("\n").filter(Boolean));
    });
  }
});
