/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { PermissionLevel } from "@plane/agent-runner-protocol";

import type { WorkspaceLayout } from "./workspace.ts";

/** Starting-mode fallback the adapters read (`INITIAL_MODE_ENV` in `@plane/acp-adapters`). */
export const INITIAL_MODE_ENV = "PLANE_AGENT_DEFAULT_MODE";

const ENV_KEY = /^[A-Z][A-Z0-9_]{0,63}$/;

/**
 * Names an admin's agent env may not set: the runner owns them, or they would let the env inject
 * code into the agent or the tools it runs (loader, interpreter and shell startup hooks).
 */
const RESERVED = new Set([
  "PATH",
  "HOME",
  "TMPDIR",
  "TMP",
  "TEMP",
  "USER",
  "LOGNAME",
  "SHELL",
  "PWD",
  "OLDPWD",
  "IFS",
  "ENV",
  "BASH_ENV",
  "PROMPT_COMMAND",
  "NODE_OPTIONS",
  "NODE_PATH",
  "NODE_REPL_EXTERNAL_MODULE",
  "PYTHONSTARTUP",
  "PYTHONPATH",
  "PYTHONHOME",
  "PERL5OPT",
  "PERL5LIB",
  "RUBYOPT",
  "RUBYLIB",
  "GCONV_PATH",
  "GIT_CONFIG_GLOBAL",
  "GIT_CONFIG_SYSTEM",
  "GIT_EXEC_PATH",
  "GIT_SSH",
  "GIT_SSH_COMMAND",
  INITIAL_MODE_ENV,
]);
const RESERVED_PREFIXES = ["LD_", "DYLD_", "MALLOC_", "AGENT_RUNNER_", "AGENT_BRIDGE_"];

export function isReservedEnvName(name: string): boolean {
  return RESERVED.has(name) || RESERVED_PREFIXES.some((prefix) => name.startsWith(prefix));
}

export interface AgentEnvInput {
  /** The agent's env from the admin config, as carried by the spawn ticket. */
  readonly agentEnv: Readonly<Record<string, string>>;
  readonly layout: WorkspaceLayout;
  readonly initialMode: PermissionLevel;
  readonly path: string;
  readonly shell: string;
}

/**
 * The complete environment of an agent process. Nothing is inherited from the runner (its own
 * secrets included): a fixed base, then the agent's own env minus reserved names. The adapters
 * scrub credential-looking names again before anything the user drives sees them.
 */
export function buildAgentEnv(input: AgentEnvInput): { env: Record<string, string>; dropped: string[] } {
  const { layout } = input;
  const user = layout.uid === undefined ? "plane-agent" : `plane-agent-${layout.uid}`;
  const env: Record<string, string> = {
    PATH: input.path,
    HOME: layout.home,
    TMPDIR: layout.tmp,
    USER: user,
    LOGNAME: user,
    SHELL: input.shell,
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    TERM: "dumb",
    [INITIAL_MODE_ENV]: input.initialMode,
  };
  const dropped: string[] = [];
  for (const [name, value] of Object.entries(input.agentEnv)) {
    if (!ENV_KEY.test(name) || typeof value !== "string" || isReservedEnvName(name)) {
      dropped.push(name);
      continue;
    }
    env[name] = value;
  }
  return { env, dropped };
}
