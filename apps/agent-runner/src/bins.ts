/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

/**
 * Adapter id → bin name. Mirrors `ADAPTER_BINS` in `@plane/acp-adapters` (a test keeps them in
 * step); duplicated so the runner does not load every provider SDK just to read a table.
 */
export const ADAPTER_BIN_NAMES = {
  claude: "plane-acp-claude",
  codex: "plane-acp-codex",
  deepseek: "plane-acp-deepseek",
  echo: "plane-acp-echo",
  gemini: "plane-acp-gemini",
} as const;

export type AdapterId = keyof typeof ADAPTER_BIN_NAMES;

/** The provider sign-in helper (`login.mjs <adapter> <start|logout|status>`) in `@plane/acp-adapters`. */
export const LOGIN_BIN_NAME = "plane-agent-login";

/** Adapters whose account sign-in the runner can drive (ChatGPT for codex, Google for gemini). */
export const LOGIN_ADAPTERS = ["codex", "gemini"] as const;
export type LoginAdapterId = (typeof LOGIN_ADAPTERS)[number];

export function isLoginAdapter(value: string): value is LoginAdapterId {
  return (LOGIN_ADAPTERS as readonly string[]).includes(value);
}

/** How to start the sign-in helper; the runner appends `<adapter> <action>`. */
export interface HelperCommand {
  readonly command: string;
  readonly args: readonly string[];
}

/** How to start one agent: always `node <bin>`, never anything an admin or user typed. */
export interface AgentCommand {
  readonly adapter: AdapterId;
  readonly command: string;
  readonly args: readonly string[];
}

export type ResolveAgentCommand = (adapter: string) => AgentCommand | undefined;

function readBinMap(): { root: string; bins: Record<string, string> } {
  const require = createRequire(import.meta.url);
  const manifestPath = require.resolve("@plane/acp-adapters/package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { bin?: Record<string, string> };
  return { root: path.dirname(manifestPath), bins: manifest.bin ?? {} };
}

/**
 * Absolute paths of the adapter bins, read from the installed package's `bin` map. A bin the
 * package does not declare maps to `undefined`: that adapter is reported missing and refused.
 */
export function adapterBinPaths(): Record<AdapterId, string | undefined> {
  const { root, bins } = readBinMap();
  const entries = Object.entries(ADAPTER_BIN_NAMES).map(([adapter, bin]) => {
    const relative = bins[bin];
    return [adapter, relative ? path.resolve(root, relative) : undefined] as const;
  });
  return Object.fromEntries(entries) as Record<AdapterId, string | undefined>;
}

/** Absolute path of the sign-in helper bin, or `undefined` when the package does not declare it. */
export function loginBinPath(): string | undefined {
  const { root, bins } = readBinMap();
  const relative = bins[LOGIN_BIN_NAME];
  return relative ? path.resolve(root, relative) : undefined;
}

/**
 * The fixed adapter → command mapping. Unknown adapters, `echo` unless enabled, and adapters the
 * installed package does not declare resolve to nothing and the connection is refused. `missing`
 * lists the adapters whose bin is not on disk (yet), for the startup log.
 */
export function createAdapterResolver(options: {
  enableEcho: boolean;
  binPaths?: Record<AdapterId, string | undefined>;
}) {
  const binPaths = options.binPaths ?? adapterBinPaths();
  const missing = (Object.keys(ADAPTER_BIN_NAMES) as AdapterId[]).filter((id) => {
    const file = binPaths[id];
    return !file || !existsSync(file);
  });
  const resolve: ResolveAgentCommand = (adapter) => {
    if (!Object.hasOwn(ADAPTER_BIN_NAMES, adapter)) return undefined;
    const id = adapter as AdapterId;
    if (id === "echo" && !options.enableEcho) return undefined;
    const file = binPaths[id];
    if (!file) return undefined;
    return { adapter: id, command: process.execPath, args: [file] };
  };
  return { resolve, missing };
}

/** `node <login.mjs>`, or `undefined` when the helper is not installed. */
export function defaultHelperCommand(file: string | undefined = loginBinPath()): HelperCommand | undefined {
  return file && existsSync(file) ? { command: process.execPath, args: [file] } : undefined;
}
