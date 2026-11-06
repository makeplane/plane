/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { BridgeConfig } from "../../src/config.ts";
import type { Logger } from "../../src/logger.ts";
import { createPlaneApi } from "../../src/plane-api.ts";
import { AgentBridge } from "../../src/server.ts";
import { FakeTransport } from "./fake-agent.ts";
import { AGENT_ID, BRIDGE_SECRET, StubPlaneApi, USER_COOKIE, WORKSPACE_SLUG, type StubAgent } from "./stub-api.ts";
import { RawClient } from "./ws-client.ts";

export const ORIGIN = "http://plane.test";

/** Every log line, so tests can check nothing secret is ever logged. */
export class RecordingLogger implements Logger {
  readonly lines: { level: string; message: string; meta?: Record<string, unknown> | undefined }[] = [];
  debug = (message: string, meta?: Record<string, unknown>) => this.lines.push({ level: "debug", message, meta });
  info = (message: string, meta?: Record<string, unknown>) => this.lines.push({ level: "info", message, meta });
  warn = (message: string, meta?: Record<string, unknown>) => this.lines.push({ level: "warn", message, meta });
  error = (message: string, meta?: Record<string, unknown>) => this.lines.push({ level: "error", message, meta });
  text(): string {
    return JSON.stringify(this.lines);
  }
}

export function testConfig(overrides: Partial<BridgeConfig> = {}): BridgeConfig {
  return {
    version: "test",
    host: "127.0.0.1",
    port: 0,
    apiBaseUrl: "http://127.0.0.1:1",
    bridgeSecret: BRIDGE_SECRET,
    runnerUrl: "ws://127.0.0.1:1/acp",
    runnerSecret: "r".repeat(40),
    basePath: "/agents",
    workspacesRoot: "/workspaces",
    planeMcpUrl: "",
    allowedOrigins: [ORIGIN],
    maxMessageBytes: 64 * 1024,
    maxAgentMessageBytes: 1024 * 1024,
    maxConnectionsPerUser: 4,
    maxConnections: 100,
    idleTimeoutMs: 60_000,
    pingIntervalMs: 30_000,
    ...overrides,
  };
}

export interface Harness {
  readonly api: StubPlaneApi;
  readonly transport: FakeTransport;
  readonly bridge: AgentBridge;
  readonly log: RecordingLogger;
  readonly baseUrl: string;
  connect(options?: { cookie?: string | null; origin?: string | null; agent?: string; workspace?: string }): RawClient;
  /** Connect and wait for the socket to open. */
  open(options?: Parameters<Harness["connect"]>[0]): Promise<RawClient>;
  stop(): Promise<void>;
}

export async function startHarness(
  options: {
    agent?: Partial<StubAgent>;
    http?: boolean;
    config?: Partial<BridgeConfig>;
    initializeTimeoutMs?: number;
  } = {}
): Promise<Harness> {
  const api = await new StubPlaneApi(options.agent).start();
  const transport = new FakeTransport({ http: options.http ?? true });
  const log = new RecordingLogger();
  const config = testConfig({ apiBaseUrl: api.url, ...options.config });
  const bridge = new AgentBridge({
    config,
    api: createPlaneApi({ baseUrl: api.url, bridgeSecret: BRIDGE_SECRET }),
    transport,
    log,
    ...(options.initializeTimeoutMs ? { initializeTimeoutMs: options.initializeTimeoutMs } : {}),
  });
  const address = await bridge.listen(0, "127.0.0.1");
  const baseUrl = `ws://127.0.0.1:${address.port}`;
  const clients: RawClient[] = [];
  const connect: Harness["connect"] = (opts = {}) => {
    const headers: Record<string, string> = {};
    const cookie = opts.cookie === undefined ? USER_COOKIE : opts.cookie;
    const origin = opts.origin === undefined ? ORIGIN : opts.origin;
    if (cookie) headers.Cookie = cookie;
    if (origin) headers.Origin = origin;
    const query = new URLSearchParams({ agent: opts.agent ?? AGENT_ID, workspace: opts.workspace ?? WORKSPACE_SLUG });
    const client = new RawClient(`${baseUrl}/agents/acp?${query}`, headers);
    clients.push(client);
    return client;
  };
  return {
    api,
    transport,
    bridge,
    log,
    baseUrl,
    connect,
    async open(opts) {
      const client = connect(opts);
      await client.opened;
      return client;
    },
    async stop() {
      for (const client of clients) client.socket.terminate();
      await bridge.close();
      await api.stop();
    },
  };
}

/** `initialize` with everything a browser could ask for, then `session/new`. */
export async function initialize(client: RawClient, capabilities: Record<string, unknown> = {}) {
  return client.request("initialize", {
    protocolVersion: 1,
    clientCapabilities: {
      fs: { readTextFile: true, writeTextFile: true },
      terminal: true,
      elicitation: { form: {} },
      auth: { terminal: true },
      ...capabilities,
    },
  });
}
