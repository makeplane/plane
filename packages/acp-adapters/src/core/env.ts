/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Variable names that look like credentials. The agent's env carries the admin's provider keys;
 * tools the user can drive (a shell, a stdio MCP server) must never see them, or a prompt like
 * "print your environment" would leak them.
 */
export const SECRET_ENV_NAME = /KEY|TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL/i;

/** Glob form of the same rule, for Codex's `shell_environment_policy.exclude`. */
export const SECRET_ENV_GLOBS = ["*KEY*", "*TOKEN*", "*SECRET*", "*PASSWORD*", "*PASSWD*", "*CREDENTIAL*"];

export function scrubSecrets(env: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && !SECRET_ENV_NAME.test(entry[0])
    )
  );
}
