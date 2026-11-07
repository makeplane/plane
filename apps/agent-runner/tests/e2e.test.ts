/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";

import type { AnyMessage } from "@agentclientprotocol/sdk";
import {
  AgentBridge,
  RunnerTransport,
  createPlaneApi,
  silentLogger,
  type AgentChannel,
  type AgentSessionGrant,
  type AgentTransport,
  type BridgeConfig,
} from "agent-bridge";
import { afterEach, describe, expect, it } from "vitest";

import {
  SECRET,
  USER_ID,
  WORKSPACE_ID,
  acpClient,
  isAlive,
  startRunner,
  tempRoot,
  textOf,
  waitUntil,
} from "./helpers.ts";

const AGENT_ID = "33333333-3333-4333-8333-333333333333";
const BRIDGE_SECRET = "bridge-secret";
const COOKIE = "session-id=abc";
const ORIGIN = "http://plane.test";
const MCP_URL = "http://mcp.internal:8211/mcp";

/** The Plane API, reduced to what the bridge calls. */
async function stubApi() {
  const revoked: string[] = [];
  const minted: string[] = [];
  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://api");
    const send = (status: number, body?: unknown) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(body === undefined ? "" : JSON.stringify(body));
    };
    if (url.pathname === "/api/users/me/") {
      return req.headers.cookie === COOKIE ? send(200, { id: USER_ID }) : send(401, {});
    }
    if (req.headers["x-agent-bridge-secret"] !== BRIDGE_SECRET) return send(403, {});
    if (req.method === "DELETE") {
      revoked.push(url.pathname.split("/").at(-2) ?? "");
      return send(204);
    }
    minted.push("token-id-1");
    return send(201, {
      token_id: "token-id-1",
      token: "plane_api_session_token",
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      workspace: { id: WORKSPACE_ID, slug: "acme" },
      user: { id: USER_ID },
      agent: {
        id: AGENT_ID,
        adapter: "echo",
        env: { ANTHROPIC_API_KEY: "sk-ant-e2e" },
        default_permission_level: "ask_writes",
        max_permission_level: "ask_writes",
        attach_plane_mcp: true,
      },
      mcp: { url: MCP_URL, workspace_slug: "acme" },
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    revoked,
    minted,
    stop: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}

/** Records every frame the bridge sends to the runner. */
class RecordingTransport implements AgentTransport {
  readonly sent: (AnyMessage & { params?: unknown })[] = [];
  readonly #inner: AgentTransport;

  constructor(inner: AgentTransport) {
    this.#inner = inner;
  }

  async open(grant: AgentSessionGrant, signal: AbortSignal): Promise<AgentChannel> {
    const channel = await this.#inner.open(grant, signal);
    const tap = new TransformStream<AnyMessage, AnyMessage>({
      transform: (message, controller) => {
        this.sent.push(message);
        controller.enqueue(message);
      },
    });
    void tap.readable.pipeTo(channel.stream.writable).catch(() => undefined);
    return { stream: { readable: channel.stream.readable, writable: tap.writable }, close: () => channel.close() };
  }
}

const stops: (() => Promise<void>)[] = [];
afterEach(async () => {
  // oxlint-disable-next-line no-await-in-loop -- stop in reverse start order
  for (const stop of stops.splice(0).toReversed()) await stop();
});

describe("browser → bridge → runner → plane-acp-echo", () => {
  it("runs initialize, session/new, prompt, permission and cancel, then cleans up", async () => {
    const root = tempRoot();
    const { runner, url: runnerUrl } = await startRunner(root);
    stops.push(() => runner.close());
    const api = await stubApi();
    stops.push(api.stop);
    const config: BridgeConfig = {
      version: "e2e",
      host: "127.0.0.1",
      port: 0,
      apiBaseUrl: api.url,
      bridgeSecret: BRIDGE_SECRET,
      runnerUrl,
      runnerSecret: SECRET,
      runnerHttpUrl: runnerUrl.replace(/^ws:/, "http:").replace(/\/acp$/, ""),
      basePath: "/agents",
      workspacesRoot: root,
      planeMcpUrl: "",
      allowedOrigins: [ORIGIN],
      maxMessageBytes: 1024 * 1024,
      maxAgentMessageBytes: 8 * 1024 * 1024,
      maxConnectionsPerUser: 2,
      maxConnections: 10,
      idleTimeoutMs: 60_000,
      pingIntervalMs: 30_000,
      loginStartLimit: 10,
      loginStartWindowMs: 60_000,
    };
    const transport = new RecordingTransport(
      new RunnerTransport({ url: runnerUrl, secret: SECRET, maxMessageBytes: config.maxAgentMessageBytes })
    );
    const bridge = new AgentBridge({
      config,
      api: createPlaneApi({ baseUrl: api.url, bridgeSecret: BRIDGE_SECRET }),
      transport,
      log: silentLogger,
    });
    const { port } = await bridge.listen(0, "127.0.0.1");
    stops.push(() => bridge.close());

    const client = acpClient(`ws://127.0.0.1:${port}/agents/acp?agent=${AGENT_ID}&workspace=acme`, {
      Cookie: COOKIE,
      Origin: ORIGIN,
    });
    const init = await client.agent.request("initialize", {
      protocolVersion: 1,
      clientCapabilities: { fs: { readTextFile: true, writeTextFile: true }, terminal: true },
    });
    expect(init.agentInfo?.name).toBe("plane-acp-echo");
    expect(init.agentCapabilities?.mcpCapabilities?.http).toBe(true);
    expect((transport.sent[0]!.params as Record<string, unknown>).clientCapabilities).toEqual({
      fs: { readTextFile: false, writeTextFile: false },
      terminal: false,
    });

    // session/new: the bridge injects the cwd, Plane MCP and the starting mode.
    const cwd = path.join(root, WORKSPACE_ID, USER_ID);
    const session = await client.agent.request("session/new", { cwd: "/somewhere/else", mcpServers: [] });
    expect(session.sessionId).toBe("echo-session-1");
    expect(session.modes?.currentModeId).toBe("ask_writes");
    expect(session.modes?.availableModes.map((mode) => mode.id)).toEqual(["ask_all", "ask_writes"]);
    const sentNew = transport.sent.find((m) => "method" in m && m.method === "session/new")!;
    expect(sentNew.params).toEqual({
      cwd,
      mcpServers: [
        {
          type: "http",
          name: "plane",
          url: MCP_URL,
          headers: [
            { name: "Authorization", value: "Bearer plane_api_session_token" },
            { name: "X-Workspace-slug", value: "acme" },
          ],
        },
      ],
      _meta: { "plane/initialModeId": "ask_writes" },
    });
    expect(statSync(cwd).mode & 0o777).toBe(0o700);

    // prompt
    const plain = await client.agent.request("session/prompt", {
      sessionId: session.sessionId,
      prompt: [{ type: "text", text: "hello from the browser" }],
    });
    expect(plain.stopReason).toBe("end_turn");
    expect(textOf(client.updates)).toContain("hello from the browser");

    // permission: a shell call in ask_writes asks the browser
    const gated = await client.agent.request("session/prompt", {
      sessionId: session.sessionId,
      prompt: [{ type: "text", text: "/tool execute Run the tests" }],
    });
    expect(gated.stopReason).toBe("end_turn");
    expect(client.permissionRequests).toHaveLength(1);
    expect(client.permissionRequests[0]!.toolCall.title).toBe("Run the tests");

    // the admin maximum holds
    await expect(
      client.agent.request("session/set_mode", { sessionId: session.sessionId, modeId: "yolo" })
    ).rejects.toMatchObject({ code: -32602 });

    // cancel
    const before = client.updates.length;
    const sleeping = client.agent.request("session/prompt", {
      sessionId: session.sessionId,
      prompt: [{ type: "text", text: "/sleep 10000" }],
    });
    await waitUntil(() => textOf(client.updates.slice(before)).includes("sleeping"));
    await client.agent.notify("session/cancel", { sessionId: session.sessionId });
    expect((await sleeping).stopReason).toBe("cancelled");

    // disconnect: the agent process is killed and the token revoked
    const [running] = runner.agents();
    expect(running?.sessionRef).toBe("token-id-1");
    client.close();
    await waitUntil(() => runner.agents().length === 0 && api.revoked.length === 1);
    expect(isAlive(running!.pid!)).toBe(false);
    expect(api.revoked).toEqual(["token-id-1"]);
    expect(bridge.connectionCount).toBe(0);
  });
});
