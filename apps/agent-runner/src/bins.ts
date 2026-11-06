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
} as const;

export type AdapterId = keyof typeof ADAPTER_BIN_NAMES;

/** How to start one agent: always `node <bin>`, never anything an admin or user typed. */
export interface AgentCommand {
  readonly adapter: AdapterId;
  readonly command: string;
  readonly args: readonly string[];
}

export type ResolveAgentCommand = (adapter: string) => AgentCommand | undefined;

/** Absolute paths of the adapter bins, read from the installed package's `bin` map. */
export function adapterBinPaths(): Record<AdapterId, string> {
  const require = createRequire(import.meta.url);
  const manifestPath = require.resolve("@plane/acp-adapters/package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { bin?: Record<string, string> };
  const root = path.dirname(manifestPath);
  const entries = Object.entries(ADAPTER_BIN_NAMES).map(([adapter, bin]) => {
    const relative = manifest.bin?.[bin];
    if (!relative) throw new Error(`@plane/acp-adapters has no "${bin}" bin`);
    return [adapter, path.resolve(root, relative)] as const;
  });
  return Object.fromEntries(entries) as Record<AdapterId, string>;
}

/**
 * The fixed adapter → command mapping. Unknown adapters, and `echo` unless enabled, resolve to
 * nothing and the connection is refused.
 */
export function createAdapterResolver(options: { enableEcho: boolean; binPaths?: Record<AdapterId, string> }) {
  const binPaths = options.binPaths ?? adapterBinPaths();
  const resolve: ResolveAgentCommand = (adapter) => {
    if (!Object.hasOwn(ADAPTER_BIN_NAMES, adapter)) return undefined;
    const id = adapter as AdapterId;
    if (id === "echo" && !options.enableEcho) return undefined;
    return { adapter: id, command: process.execPath, args: [binPaths[id]] };
  };
  const missing = (Object.keys(binPaths) as AdapterId[]).filter((id) => !existsSync(binPaths[id]));
  return { resolve, missing };
}
