/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { MIN_SECRET_LENGTH } from "@plane/agent-runner-protocol";
import { z } from "zod";

const MiB = 1024 * 1024;

const positiveInt = (fallback: number) => z.coerce.number().int().positive().default(fallback);

const schema = z.object({
  APP_VERSION: z.string().default("1.0.0"),
  HOST: z.string().default("0.0.0.0"),
  PORT: positiveInt(3400),
  API_BASE_URL: z.url("API_BASE_URL must be a valid URL"),
  AGENT_BRIDGE_SECRET: z.string().min(1, "AGENT_BRIDGE_SECRET is required"),
  AGENT_RUNNER_URL: z.url("AGENT_RUNNER_URL must be a ws:// or wss:// URL").refine((url) => /^wss?:\/\//.test(url), {
    message: "AGENT_RUNNER_URL must be a ws:// or wss:// URL",
  }),
  AGENT_RUNNER_SECRET: z.string().min(MIN_SECRET_LENGTH, `AGENT_RUNNER_SECRET needs ${MIN_SECRET_LENGTH}+ characters`),
  AGENT_BRIDGE_BASE_PATH: z
    .string()
    .default("/agents")
    .transform((value) => `/${value.replace(/^\/+|\/+$/g, "")}`.replace(/^\/$/, "")),
  AGENT_WORKSPACES_ROOT: z
    .string()
    .default("/workspaces")
    .refine((value) => value.startsWith("/"), { message: "AGENT_WORKSPACES_ROOT must be absolute" })
    .transform((value) => value.replace(/\/+$/, "") || "/"),
  PLANE_MCP_URL: z.string().default(""),
  CORS_ALLOWED_ORIGINS: z.string().default(""),
  AGENT_BRIDGE_MAX_MESSAGE_BYTES: positiveInt(4 * MiB),
  AGENT_BRIDGE_MAX_AGENT_MESSAGE_BYTES: positiveInt(32 * MiB),
  AGENT_BRIDGE_MAX_CONNECTIONS_PER_USER: positiveInt(4),
  AGENT_BRIDGE_MAX_CONNECTIONS: positiveInt(500),
  AGENT_BRIDGE_IDLE_TIMEOUT_MS: positiveInt(15 * 60_000),
  AGENT_BRIDGE_PING_INTERVAL_MS: positiveInt(30_000),
});

export interface BridgeConfig {
  readonly version: string;
  readonly host: string;
  readonly port: number;
  /** Plane API origin, e.g. `http://api:8000`. */
  readonly apiBaseUrl: string;
  /** Shared secret for the API's internal agent-session endpoint. */
  readonly bridgeSecret: string;
  /** Runner ACP WebSocket endpoint. */
  readonly runnerUrl: string;
  /** Signs spawn tickets for the runner. */
  readonly runnerSecret: string;
  /** Mount point; the chat socket is `<basePath>/acp`, health is `<basePath>/health`. */
  readonly basePath: string;
  /** Root of the per-user working dirs on the runner; the ACP `cwd` is `<root>/<workspace_id>/<user_id>`. */
  readonly workspacesRoot: string;
  /** Overrides the API's Plane MCP URL (the runner reaches MCP on an internal address). */
  readonly planeMcpUrl: string;
  /** Origins allowed to open the chat socket; empty allows the bridge's own host only. */
  readonly allowedOrigins: readonly string[];
  /** Largest frame accepted from the browser. */
  readonly maxMessageBytes: number;
  /** Largest frame accepted from the runner. */
  readonly maxAgentMessageBytes: number;
  readonly maxConnectionsPerUser: number;
  readonly maxConnections: number;
  /** Close a connection after this long without traffic while no request is in flight. */
  readonly idleTimeoutMs: number;
  readonly pingIntervalMs: number;
}

export function loadBridgeConfig(env: NodeJS.ProcessEnv = process.env): BridgeConfig {
  const result = schema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Invalid agent-bridge environment:\n  ${problems.join("\n  ")}`);
  }
  const e = result.data;
  return {
    version: e.APP_VERSION,
    host: e.HOST,
    port: e.PORT,
    apiBaseUrl: e.API_BASE_URL.replace(/\/+$/, ""),
    bridgeSecret: e.AGENT_BRIDGE_SECRET,
    runnerUrl: e.AGENT_RUNNER_URL,
    runnerSecret: e.AGENT_RUNNER_SECRET,
    basePath: e.AGENT_BRIDGE_BASE_PATH,
    workspacesRoot: e.AGENT_WORKSPACES_ROOT,
    planeMcpUrl: e.PLANE_MCP_URL.trim(),
    allowedOrigins: e.CORS_ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean),
    maxMessageBytes: e.AGENT_BRIDGE_MAX_MESSAGE_BYTES,
    maxAgentMessageBytes: e.AGENT_BRIDGE_MAX_AGENT_MESSAGE_BYTES,
    maxConnectionsPerUser: e.AGENT_BRIDGE_MAX_CONNECTIONS_PER_USER,
    maxConnections: e.AGENT_BRIDGE_MAX_CONNECTIONS,
    idleTimeoutMs: e.AGENT_BRIDGE_IDLE_TIMEOUT_MS,
    pingIntervalMs: e.AGENT_BRIDGE_PING_INTERVAL_MS,
  };
}
