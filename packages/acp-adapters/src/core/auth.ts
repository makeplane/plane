/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { mkdirSync } from "node:fs";
import { homedir } from "node:os";

/**
 * How the agent signs in to its provider, set by the API from the user's or the workspace's
 * credential (Workspace settings → AI providers), or by an admin in the agent env. Absent means
 * "whatever the env carries" (the adapters' original behaviour).
 */
export const AGENT_AUTH_ENV = "PLANE_AGENT_AUTH";

export const AGENT_AUTH_MODES = ["api_key", "chatgpt", "google_account"] as const;

/** Where users manage their provider credentials; every auth error points there. */
export const AI_PROVIDERS_SETTINGS = "Workspace settings → AI providers";

/**
 * The requested auth mode, `undefined` when unset. An unrecognised value is returned as-is so the
 * adapter can refuse it with a clear message instead of guessing.
 */
export function agentAuthMode(env: NodeJS.ProcessEnv): string | undefined {
  return env[AGENT_AUTH_ENV]?.trim() || undefined;
}

/** The agent's home: `HOME` from the runner, else the OS home. */
export function agentHome(env: NodeJS.ProcessEnv): string {
  return env.HOME?.trim() || homedir();
}

/** Create a directory only its owner can read (provider homes hold sign-in files). */
export function ensurePrivateDir(dir: string): string {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}
