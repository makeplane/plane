/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import path from "node:path";

import { MIN_SECRET_LENGTH } from "@plane/agent-runner-protocol";
import { z } from "zod";

const MiB = 1024 * 1024;
const positiveInt = (fallback: number) => z.coerce.number().int().positive().default(fallback);
const flag = z
  .string()
  .default("false")
  .transform((value) => ["1", "true", "yes", "on"].includes(value.trim().toLowerCase()));

export type IsolationMode = "uid" | "none";

const schema = z
  .object({
    APP_VERSION: z.string().default("1.0.0"),
    HOST: z.string().default("0.0.0.0"),
    PORT: positiveInt(3410),
    AGENT_RUNNER_SECRET: z
      .string()
      .min(MIN_SECRET_LENGTH, `AGENT_RUNNER_SECRET needs ${MIN_SECRET_LENGTH}+ characters`),
    AGENT_WORKSPACES_ROOT: z
      .string()
      .default("/workspaces")
      .refine((value) => path.isAbsolute(value), { message: "AGENT_WORKSPACES_ROOT must be absolute" }),
    AGENT_RUNNER_ISOLATION: z.enum(["uid", "none"]).default("uid"),
    AGENT_RUNNER_UID_MIN: positiveInt(20_000),
    AGENT_RUNNER_UID_MAX: positiveInt(59_999),
    AGENT_RUNNER_ENABLE_ECHO: flag,
    AGENT_RUNNER_AGENT_PATH: z.string().optional(),
    AGENT_RUNNER_AGENT_SHELL: z.string().default("/bin/bash"),
    AGENT_RUNNER_KILL_GRACE_MS: positiveInt(3_000),
    AGENT_RUNNER_MAX_MESSAGE_BYTES: positiveInt(8 * MiB),
    AGENT_RUNNER_MAX_CONNECTIONS: positiveInt(64),
    AGENT_RUNNER_MAX_HEADER_BYTES: positiveInt(256 * 1024),
  })
  .refine((e) => e.AGENT_RUNNER_UID_MIN >= 1_000 && e.AGENT_RUNNER_UID_MIN <= e.AGENT_RUNNER_UID_MAX, {
    message: "AGENT_RUNNER_UID_MIN..AGENT_RUNNER_UID_MAX must be a non-empty range starting at 1000 or above",
  });

export interface RunnerConfig {
  readonly version: string;
  readonly host: string;
  readonly port: number;
  /** Verifies the bridge's spawn tickets. */
  readonly secret: string;
  /** Root of the per-user working dirs (a named volume in production). */
  readonly workspacesRoot: string;
  /** `uid`: every workspace dir gets its own unprivileged uid (needs root). `none`: dev only. */
  readonly isolation: IsolationMode;
  readonly uidRange: { readonly min: number; readonly max: number };
  /** Allow the `echo` test agent (development and tests only). */
  readonly enableEcho: boolean;
  /** `PATH` the agents see. */
  readonly agentPath: string;
  /** `SHELL` the agents see (Codex runs commands with it). */
  readonly agentShell: string;
  /** After SIGTERM, how long an agent's process group has before SIGKILL. */
  readonly killGraceMs: number;
  /** Largest frame accepted from the bridge. */
  readonly maxMessageBytes: number;
  readonly maxConnections: number;
  /** Spawn tickets carry the agent env, so the upgrade's headers can be large. */
  readonly maxHeaderBytes: number;
}

export function defaultAgentPath(): string {
  return [path.dirname(process.execPath), "/usr/local/sbin", "/usr/local/bin", "/usr/sbin", "/usr/bin", "/sbin", "/bin"]
    .filter((dir, index, all) => all.indexOf(dir) === index)
    .join(":");
}

export function loadRunnerConfig(env: NodeJS.ProcessEnv = process.env): RunnerConfig {
  const result = schema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Invalid agent-runner environment:\n  ${problems.join("\n  ")}`);
  }
  const e = result.data;
  return {
    version: e.APP_VERSION,
    host: e.HOST,
    port: e.PORT,
    secret: e.AGENT_RUNNER_SECRET,
    workspacesRoot: path.resolve(e.AGENT_WORKSPACES_ROOT),
    isolation: e.AGENT_RUNNER_ISOLATION,
    uidRange: { min: e.AGENT_RUNNER_UID_MIN, max: e.AGENT_RUNNER_UID_MAX },
    enableEcho: e.AGENT_RUNNER_ENABLE_ECHO,
    agentPath: e.AGENT_RUNNER_AGENT_PATH || defaultAgentPath(),
    agentShell: e.AGENT_RUNNER_AGENT_SHELL,
    killGraceMs: e.AGENT_RUNNER_KILL_GRACE_MS,
    maxMessageBytes: e.AGENT_RUNNER_MAX_MESSAGE_BYTES,
    maxConnections: e.AGENT_RUNNER_MAX_CONNECTIONS,
    maxHeaderBytes: e.AGENT_RUNNER_MAX_HEADER_BYTES,
  };
}
