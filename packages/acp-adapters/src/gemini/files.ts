/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ensurePrivateDir } from "../core/auth.ts";
import { objectValue, stringValue, type JsonObject } from "../core/json.ts";

/** Gemini CLI keeps everything under `<GEMINI_CLI_HOME or HOME>/.gemini`. */
export const GEMINI_DIR = ".gemini";
export const OAUTH_CREDS_FILE = "oauth_creds.json";
export const GOOGLE_ACCOUNTS_FILE = "google_accounts.json";
export const SETTINGS_FILE = "settings.json";
/** Our ACP session id → Gemini's own session id, so `session/load` finds the conversation. */
export const SESSION_MAP_FILE = "plane-acp-sessions.json";
/** `security.auth.selectedType` for a Google sign-in. */
export const GOOGLE_AUTH_TYPE = "oauth-personal";
export const API_KEY_AUTH_TYPE = "gemini-api-key";

const PACKAGE_NAME = "@plane/acp-adapters";
const MAX_MAPPED_SESSIONS = 500;

let cachedRoot: string | undefined;

/** The package root (works from `src/` under tests and from `dist/` once built). */
export function packageRoot(): string {
  if (cachedRoot) return cachedRoot;
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (;;) {
    const manifest = path.join(dir, "package.json");
    if (existsSync(manifest) && objectValue(readJson(manifest)).name === PACKAGE_NAME) {
      cachedRoot = dir;
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`${PACKAGE_NAME}: package root not found`);
    dir = parent;
  }
}

/** Files shipped in `packages/acp-adapters/gemini/` and handed to Gemini CLI by absolute path. */
export function geminiAsset(...parts: string[]): string {
  return path.join(packageRoot(), "gemini", ...parts);
}

/** The admin policy that turns every tool call into a permission request (`--admin-policy`). */
export function geminiPolicyPath(): string {
  return geminiAsset("policies", "plane.toml");
}

/** System settings (`GEMINI_CLI_SYSTEM_SETTINGS_PATH`) for an auth mode. */
export function geminiSystemSettingsPath(kind: "api_key" | "google_account"): string {
  return geminiAsset(kind === "api_key" ? "system-settings.api-key.json" : "system-settings.google-account.json");
}

export function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

/** Write a JSON file atomically, readable by its owner only. */
export function writePrivateJson(file: string, value: unknown): void {
  ensurePrivateDir(path.dirname(file));
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temp, file);
}

/** True when `<dir>/oauth_creds.json` holds a Google sign-in Gemini CLI can refresh. */
export function hasGoogleCredentials(geminiDir: string): boolean {
  const creds = objectValue(readJson(path.join(geminiDir, OAUTH_CREDS_FILE)));
  return Boolean(stringValue(creds.refresh_token) || stringValue(creds.access_token));
}

/** The signed-in Google account email Gemini CLI caches, if any. */
export function googleAccountEmail(geminiDir: string): string | undefined {
  return stringValue(objectValue(readJson(path.join(geminiDir, GOOGLE_ACCOUNTS_FILE))).active) || undefined;
}

/**
 * Set (or with `undefined`, drop) `security.auth.selectedType` in `<dir>/settings.json`, keeping
 * everything else. Gemini CLI clears its cached Google credentials when `authenticate` names a
 * method other than this one, so it must match before the adapter authenticates.
 */
export function setSelectedAuthType(geminiDir: string, authType: string | undefined): void {
  const file = path.join(geminiDir, SETTINGS_FILE);
  const settings = { ...objectValue(readJson(file)) };
  const security = { ...objectValue(settings.security) };
  const auth = { ...objectValue(security.auth) };
  if (authType === undefined) {
    if (!("selectedType" in auth)) return;
    delete auth.selectedType;
  } else {
    if (auth.selectedType === authType) return;
    auth.selectedType = authType;
  }
  security.auth = auth;
  settings.security = security;
  writePrivateJson(file, settings);
}

/** Our session id → Gemini's, persisted next to Gemini's own session storage. */
export class SessionMap {
  readonly #file: string;

  constructor(geminiDir: string) {
    this.#file = path.join(geminiDir, SESSION_MAP_FILE);
  }

  get(sessionId: string): string | undefined {
    return stringValue(this.#read()[sessionId]) || undefined;
  }

  set(sessionId: string, geminiSessionId: string): void {
    const entries = Object.entries(this.#read()).filter(([key]) => key !== sessionId);
    entries.push([sessionId, geminiSessionId]);
    writePrivateJson(this.#file, Object.fromEntries(entries.slice(-MAX_MAPPED_SESSIONS)));
  }

  #read(): JsonObject {
    return objectValue(readJson(this.#file));
  }
}
