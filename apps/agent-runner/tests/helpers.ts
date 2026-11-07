/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- polling */
import { mkdtempSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  client,
  type ClientContext,
  type RequestPermissionRequest,
  type SessionNotification,
} from "@agentclientprotocol/sdk";
import { createWebSocketStream, type WebSocketConstructor } from "@agentclientprotocol/sdk/experimental/ws-client";
import { signSpawnTicket, type SignOptions, type SpawnClaims } from "@plane/agent-runner-protocol";
import { WebSocket } from "ws";

import { defaultAgentPath, type RunnerConfig } from "../src/config.ts";
import { silentLogger } from "../src/logger.ts";
import { AgentRunner, type AgentRunnerOptions } from "../src/server.ts";

export const SECRET = "r".repeat(40);
export const USER_ID = "11111111-1111-4111-8111-111111111111";
export const OTHER_USER_ID = "44444444-4444-4444-8444-444444444444";
export const WORKSPACE_ID = "22222222-2222-4222-8222-222222222222";

export function tempRoot(prefix = "agent-runner-"): string {
  return realpathSync(mkdtempSync(path.join(tmpdir(), prefix)));
}

export function runnerConfig(root: string, overrides: Partial<RunnerConfig> = {}): RunnerConfig {
  return {
    version: "test",
    host: "127.0.0.1",
    port: 0,
    secret: SECRET,
    workspacesRoot: root,
    isolation: "none",
    uidRange: { min: 20_000, max: 20_009 },
    enableEcho: true,
    agentPath: defaultAgentPath(),
    agentShell: "/bin/sh",
    killGraceMs: 300,
    maxMessageBytes: 1024 * 1024,
    maxConnections: 8,
    maxHeaderBytes: 256 * 1024,
    ...overrides,
  };
}

export async function startRunner(
  root: string,
  options: Partial<Omit<AgentRunnerOptions, "config">> & { config?: Partial<RunnerConfig> } = {}
): Promise<{ runner: AgentRunner; url: string }> {
  const { config, ...rest } = options;
  const runner = new AgentRunner({ config: runnerConfig(root, config), log: silentLogger, ...rest });
  const address = await runner.listen(0, "127.0.0.1");
  return { runner, url: `ws://127.0.0.1:${address.port}/acp` };
}

export function claims(overrides: Partial<SpawnClaims> = {}): SpawnClaims {
  return {
    adapter: "echo",
    env: { ANTHROPIC_API_KEY: "sk-ant-agent-key" },
    userId: USER_ID,
    workspaceId: WORKSPACE_ID,
    initialMode: "ask_writes",
    sessionRef: "token-1",
    ...overrides,
  };
}

export function ticket(overrides: Partial<SpawnClaims> = {}, options: SignOptions = {}): string {
  return signSpawnTicket(claims(overrides), SECRET, options);
}

/** Try an upgrade; resolves with the HTTP status the runner refused it with, or 101. */
export function upgradeStatus(url: string, headers: Record<string, string>): Promise<number> {
  return new Promise((resolve) => {
    const socket = new WebSocket(url, { headers });
    socket.on("open", () => {
      socket.terminate();
      resolve(101);
    });
    socket.on("unexpected-response", (_req, res) => {
      resolve(res.statusCode ?? 0);
      socket.terminate();
    });
    socket.on("error", () => resolve(0));
  });
}

export interface AcpTestClient {
  readonly agent: ClientContext;
  readonly updates: SessionNotification[];
  readonly permissionRequests: RequestPermissionRequest[];
  close(): void;
}

/** An SDK `client()` over ACP-on-WebSocket that allows every permission prompt once. */
export function acpClient(url: string, headers: Record<string, string>): AcpTestClient {
  const updates: SessionNotification[] = [];
  const permissionRequests: RequestPermissionRequest[] = [];
  const stream = createWebSocketStream(url, {
    WebSocket: WebSocket as unknown as WebSocketConstructor,
    headers,
  });
  const connection = client({ name: "agent-runner-test" })
    .onNotification("session/update", ({ params }) => {
      updates.push(params);
    })
    .onRequest("session/request_permission", async ({ params }) => {
      permissionRequests.push(params);
      return { outcome: { outcome: "selected", optionId: "allow_once" } };
    })
    .connect(stream);
  return { agent: connection.agent, updates, permissionRequests, close: () => connection.close() };
}

export async function waitUntil<T>(
  probe: () => T | undefined | false | Promise<T | undefined | false>,
  timeoutMs = 10_000
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await probe();
    if (value !== undefined && value !== false) return value;
    if (Date.now() > deadline) throw new Error("timed out");
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

export function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function textOf(updates: readonly SessionNotification[]): string {
  return updates
    .map((n) => n.update)
    .map((u) => (u.sessionUpdate === "agent_message_chunk" && u.content.type === "text" ? u.content.text : ""))
    .join("");
}

/** A `login` ticket (sign-in endpoints) for `adapter`, codex by default. */
export function loginTicket(overrides: Partial<SpawnClaims> = {}, options: SignOptions = {}): string {
  return ticket({ adapter: "codex", env: {}, initialMode: "ask_all", purpose: "login", ...overrides }, options);
}

/** Call one of the runner's `/auth/*` endpoints with a fresh ticket (or `token`, or none with `null`). */
export async function authCall(
  wsUrl: string,
  route: string,
  init: { method?: "GET" | "POST"; body?: unknown; token?: string | null; claims?: Partial<SpawnClaims> } = {}
): Promise<{ status: number; body: Record<string, unknown> }> {
  const base = wsUrl.replace(/^ws:/, "http:").replace(/\/acp$/, "");
  const token = init.token === undefined ? loginTicket(init.claims) : init.token;
  const headers: Record<string, string> = {};
  if (token !== null) headers.Authorization = `Bearer ${token}`;
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${base}/auth/${route}`, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers,
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
  const text = await response.text();
  return { status: response.status, body: text ? (JSON.parse(text) as Record<string, unknown>) : {} };
}
