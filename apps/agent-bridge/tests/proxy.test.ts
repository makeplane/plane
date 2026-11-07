/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it } from "vitest";

import { CloseCode } from "../src/proxy.ts";
import { initialize, startHarness, type Harness } from "./helpers/harness.ts";
import { MCP_URL, USER_ID, WORKSPACE_ID, WORKSPACE_SLUG } from "./helpers/stub-api.ts";
import { waitUntil } from "./helpers/ws-client.ts";

let harness: Harness | undefined;
afterEach(async () => {
  await harness?.stop();
  harness = undefined;
});

const CWD = `/workspaces/${WORKSPACE_ID}/${USER_ID}`;
const NOTICES = { session: { notices: {} } };

async function ready(options: Parameters<typeof startHarness>[0] = {}, capabilities = {}) {
  harness = await startHarness(options);
  const client = await harness.open();
  const init = await initialize(client, capabilities);
  const agent = harness.transport.agents[0]!;
  return { harness, client, agent, init };
}

describe("initialize", () => {
  it("forces fs and terminal off and strips elicitation and auth capabilities", async () => {
    const { agent, init } = await ready({}, NOTICES);
    expect(init.result).toMatchObject({ protocolVersion: 1 });
    expect(agent.received[0]).toMatchObject({ method: "initialize" });
    expect(agent.received[0]!.params!.clientCapabilities).toEqual({
      fs: { readTextFile: false, writeTextFile: false },
      terminal: false,
      session: { notices: {} },
    });
  });
});

describe("session setup rewrite", () => {
  it("pins cwd, replaces mcpServers with Plane MCP and sets the starting mode", async () => {
    const { client, agent } = await ready();
    const response = await client.request("session/new", {
      cwd: "/etc",
      additionalDirectories: ["/root"],
      mcpServers: [{ name: "evil", command: "/bin/sh", args: ["-c", "id"], env: [] }],
    });
    const sent = agent.received.find((m) => m.method === "session/new")!;
    expect(sent.params).toEqual({
      cwd: CWD,
      mcpServers: [
        {
          type: "http",
          name: "plane",
          url: MCP_URL,
          headers: [
            { name: "Authorization", value: `Bearer ${harness!.api.minted[0]!.token}` },
            { name: "X-Workspace-slug", value: WORKSPACE_SLUG },
          ],
        },
      ],
      _meta: { "plane/initialModeId": "ask_writes" },
    });
    // Modes above the admin maximum are not offered.
    expect(response.result!.modes).toEqual({
      currentModeId: "ask_writes",
      availableModes: [
        { id: "ask_all", name: "ask_all" },
        { id: "ask_writes", name: "ask_writes" },
      ],
    });
  });

  it("applies the same rewrite to session/load and session/resume, and pins session/list", async () => {
    const { client, agent } = await ready();
    await client.request("session/load", { sessionId: "s-9", cwd: "/tmp", mcpServers: [] });
    await client.request("session/resume", { sessionId: "s-9", cwd: "/tmp" });
    await client.request("session/list", { cwd: "/somewhere/else" });
    for (const method of ["session/load", "session/resume"]) {
      const sent = agent.received.find((m) => m.method === method)!;
      expect(sent.params).toMatchObject({ sessionId: "s-9", cwd: CWD, _meta: { "plane/initialModeId": "ask_writes" } });
      expect(sent.params!.mcpServers).toHaveLength(1);
    }
    expect(agent.received.find((m) => m.method === "session/list")!.params).toEqual({ cwd: CWD });
  });

  it("uses the bridge's PLANE_MCP_URL override", async () => {
    const { client, agent } = await ready({ config: { planeMcpUrl: "http://mcp:8211/mcp" } });
    await client.request("session/new", { cwd: "/", mcpServers: [] });
    const sent = agent.received.find((m) => m.method === "session/new")!;
    expect((sent.params!.mcpServers as { url: string }[])[0]!.url).toBe("http://mcp:8211/mcp");
  });
});

describe("permission-level cap", () => {
  it("clamps the admin default and the browser's requested starting mode to the maximum", async () => {
    const { client, agent } = await ready({
      agent: { default_permission_level: "yolo", max_permission_level: "ask_writes" },
    });
    await client.request("session/new", { cwd: "/", mcpServers: [] });
    await client.request("session/new", { cwd: "/", mcpServers: [], _meta: { "plane/initialModeId": "yolo" } });
    await client.request("session/new", { cwd: "/", mcpServers: [], _meta: { "plane/initialModeId": "ask_all" } });
    const modes = agent.received
      .filter((m) => m.method === "session/new")
      .map((m) => (m.params!._meta as Record<string, unknown>)["plane/initialModeId"]);
    expect(modes).toEqual(["ask_writes", "ask_writes", "ask_all"]);
  });

  it("rejects set_mode above the maximum without forwarding it", async () => {
    const { client, agent } = await ready({ agent: { max_permission_level: "ask_writes" } });
    const above = await client.request("session/set_mode", { sessionId: "fake-session-1", modeId: "yolo" });
    expect(above.error).toMatchObject({ code: -32602 });
    expect(above.error!.message).toContain("above the maximum");
    const unknown = await client.request("session/set_mode", { sessionId: "fake-session-1", modeId: "root" });
    expect(unknown.error).toMatchObject({ code: -32602 });
    const allowed = await client.request("session/set_mode", { sessionId: "fake-session-1", modeId: "ask_all" });
    expect(allowed.result).toEqual({});
    const forwarded = agent.received.filter((m) => m.method === "session/set_mode").map((m) => m.params!.modeId);
    expect(forwarded).toEqual(["ask_all"]);
  });

  it("allows yolo when the admin maximum is yolo", async () => {
    const { client } = await ready({ agent: { max_permission_level: "yolo" } });
    const response = await client.request("session/set_mode", { sessionId: "fake-session-1", modeId: "yolo" });
    expect(response.result).toEqual({});
  });
});

describe("Plane MCP notice", () => {
  it("sends a notice instead of attaching MCP when the agent lacks HTTP MCP", async () => {
    const { client, agent } = await ready({ http: false }, NOTICES);
    const response = await client.request("session/new", { cwd: "/", mcpServers: [] });
    expect(agent.received.find((m) => m.method === "session/new")!.params!.mcpServers).toEqual([]);
    const notice = await client.waitFor((f) => f.method === "session/update");
    expect(notice.params).toEqual({
      sessionId: "fake-session-1",
      update: {
        sessionUpdate: "notice",
        severity: "warning",
        title: "Plane tools unavailable",
        description: "This agent does not support HTTP MCP servers, so it cannot read or change Plane data.",
      },
    });
    // The response comes first, then the notice.
    expect(client.frames.indexOf(response)).toBeLessThan(client.frames.indexOf(notice));
  });

  it("falls back to an agent message when the browser does not support notices", async () => {
    const { client } = await ready({ http: false });
    await client.request("session/new", { cwd: "/", mcpServers: [] });
    const update = await client.waitFor((f) => f.method === "session/update");
    expect(update.params!.update).toMatchObject({
      sessionUpdate: "agent_message_chunk",
      content: { type: "text" },
      _meta: { "plane/notice": true },
    });
  });

  it("explains when the instance has no MCP URL", async () => {
    harness = await startHarness();
    harness.api.mcpUrl = "";
    const client = await harness.open();
    await initialize(client, NOTICES);
    await client.request("session/load", { sessionId: "s-1", cwd: "/", mcpServers: [] });
    const notice = await client.waitFor((f) => f.method === "session/update");
    expect(notice.params).toMatchObject({
      sessionId: "s-1",
      update: { sessionUpdate: "notice", description: expect.stringContaining("not configured") },
    });
  });

  it("stays quiet when the admin did not ask for Plane MCP", async () => {
    const { client, agent } = await ready({ http: false, agent: { attach_plane_mcp: false } }, NOTICES);
    await client.request("session/new", { cwd: "/", mcpServers: [] });
    await client.request("session/prompt", { sessionId: "fake-session-1", prompt: [] });
    expect(agent.received.find((m) => m.method === "session/new")!.params!.mcpServers).toEqual([]);
    expect(client.frames.some((f) => f.method === "session/update")).toBe(false);
  });
});

describe("method allowlist", () => {
  it("refuses client methods outside the allowlist and never forwards them", async () => {
    const { client, agent } = await ready();
    for (const method of ["authenticate", "logout", "fs/read_text_file", "terminal/create", "_plane/debug", "x"]) {
      // oxlint-disable-next-line no-await-in-loop -- one request at a time
      const response = await client.request(method, {});
      expect(response.error, method).toMatchObject({ code: -32601 });
    }
    client.send({ method: "session/update", params: {} });
    client.send({ method: "_plane/notify", params: {} });
    client.send({ method: "session/cancel", params: { sessionId: "fake-session-1" } });
    client.send({ method: "$/cancel_request", params: { requestId: 7 } });
    await waitUntil(() => agent.received.some((m) => m.method === "$/cancel_request"));
    expect(agent.received.map((m) => m.method)).toEqual(["initialize", "session/cancel", "$/cancel_request"]);
  });

  it("refuses agent requests outside the allowlist and answers them for the browser", async () => {
    const { client, agent } = await ready();
    await agent.send({ id: "a1", method: "fs/read_text_file", params: { sessionId: "s", path: "/etc/passwd" } });
    await agent.send({ id: "a2", method: "terminal/create", params: { sessionId: "s", command: "sh" } });
    await agent.send({ id: "a3", method: "elicitation/create", params: {} });
    await agent.send({ id: "a4", method: "_vendor/thing", params: {} });
    await agent.send({ method: "_vendor/notify", params: {} });
    await agent.send({
      method: "session/update",
      params: { sessionId: "s", update: { sessionUpdate: "plan", entries: [] } },
    });
    await client.waitFor((f) => f.method === "session/update");
    const answers = await waitUntil(() => {
      const found = agent.received.filter((m) => typeof m.id === "string" && m.id.startsWith("a") && "error" in m);
      return found.length === 4 ? found : undefined;
    });
    for (const answer of answers) expect(answer.error).toMatchObject({ code: -32601 });
    expect(client.frames.map((f) => f.method).filter(Boolean)).toEqual(["session/update"]);
  });

  it("relays permission requests and only the answers the agent asked for", async () => {
    const { client, agent } = await ready();
    await agent.send({
      id: 77,
      method: "session/request_permission",
      params: { sessionId: "s", toolCall: { toolCallId: "t1" }, options: [] },
    });
    const request = await client.waitFor((f) => f.method === "session/request_permission");
    client.send({ id: 999, result: { outcome: { outcome: "cancelled" } } }); // never asked: dropped
    client.send({ id: request.id, result: { outcome: { outcome: "selected", optionId: "allow_once" } } });
    const answer = await waitUntil(() => agent.received.find((m) => m.id === 77));
    expect(answer).toMatchObject({ result: { outcome: { outcome: "selected", optionId: "allow_once" } } });
    expect(agent.received.some((m) => m.id === 999)).toBe(false);
  });
});

describe("lifecycle", () => {
  it("closes the agent and revokes the token when the browser disconnects", async () => {
    const { client, agent } = await ready();
    client.socket.close();
    await waitUntil(() => agent.closed && harness!.api.revoked.length === 1);
    expect(harness!.api.revoked).toEqual([harness!.api.minted[0]!.tokenId]);
    await waitUntil(() => harness!.bridge.connectionCount === 0);
  });

  it("closes the browser socket and revokes when the agent goes away", async () => {
    const { client, agent } = await ready();
    agent.channel.close();
    expect(await client.closed()).toBe(CloseCode.agentUnavailable);
    await waitUntil(() => harness!.api.revoked.length === 1);
  });

  it("closes an idle connection", async () => {
    harness = await startHarness({ config: { idleTimeoutMs: 150 } });
    const client = await harness.open();
    await initialize(client);
    expect(await client.closed()).toBe(CloseCode.idleTimeout);
    await waitUntil(() => harness!.transport.agents[0]!.closed && harness!.api.revoked.length === 1);
  });

  it("closes a connection that never sends initialize", async () => {
    harness = await startHarness({ initializeTimeoutMs: 150 });
    const client = await harness.open();
    expect(await client.closed()).toBe(CloseCode.idleTimeout);
    expect(client.closeReason).toBe("No initialize");
    await waitUntil(() => harness!.transport.agents[0]!.closed && harness!.api.revoked.length === 1);
  });

  it("keeps an initialized connection past the initialize deadline", async () => {
    harness = await startHarness({ initializeTimeoutMs: 100 });
    const client = await harness.open();
    await initialize(client);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(client.closeCode).toBeUndefined();
  });

  it("does not time out while a request is in flight", async () => {
    harness = await startHarness({ config: { idleTimeoutMs: 150 } });
    const client = await harness.open();
    await initialize(client);
    const agent = harness.transport.agents[0]!;
    // A permission request the browser has not answered yet keeps the connection busy.
    await agent.send({
      id: 5,
      method: "session/request_permission",
      params: { sessionId: "s", toolCall: {}, options: [] },
    });
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(client.closeCode).toBeUndefined();
  });

  it("closes the connection when the agent-session token expires", async () => {
    harness = await startHarness();
    harness.api.expiresInMs = 200;
    const client = await harness.open();
    expect(await client.closed()).toBe(CloseCode.sessionExpired);
    await waitUntil(() => harness!.api.revoked.length === 1);
  });

  it("closes connections and revokes tokens on shutdown", async () => {
    harness = await startHarness();
    const client = await harness.open();
    await initialize(client);
    const { api, bridge } = harness;
    await bridge.close();
    expect(await client.closed()).toBe(1001);
    expect(api.revoked).toEqual([api.minted[0]!.tokenId]);
  });

  it("closes the socket on an oversized frame", async () => {
    harness = await startHarness({ config: { maxMessageBytes: 1024 } });
    const client = await harness.open();
    await initialize(client);
    client.send({ id: 1, method: "session/prompt", params: { text: "x".repeat(4096) } });
    expect(await client.closed()).toBe(1009);
    await waitUntil(() => harness!.api.revoked.length === 1);
  });
});
