/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it } from "vitest";

import { createPlaneApi } from "../src/plane-api.ts";
import { CloseCode } from "../src/proxy.ts";
import { AgentBridge } from "../src/server.ts";
import { FakeTransport } from "./helpers/fake-agent.ts";
import { ORIGIN, RecordingLogger, initialize, startHarness, testConfig, type Harness } from "./helpers/harness.ts";
import {
  AGENT_ID,
  DISABLED_AGENT_ID,
  OUTSIDER_COOKIE,
  StubPlaneApi,
  USER_COOKIE,
  WORKSPACE_SLUG,
} from "./helpers/stub-api.ts";
import { RawClient, waitUntil } from "./helpers/ws-client.ts";

let harness: Harness | undefined;
afterEach(async () => {
  await harness?.stop();
  harness = undefined;
});

describe("admission", () => {
  it("serves health", async () => {
    harness = await startHarness();
    const response = await fetch(harness.baseUrl.replace("ws:", "http:") + "/agents/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "OK", connections: 0 });
  });

  it("refuses a connection without a cookie", async () => {
    harness = await startHarness();
    const client = harness.connect({ cookie: null });
    expect(await client.closed()).toBe(CloseCode.unauthenticated);
    expect(harness.api.minted).toHaveLength(0);
    expect(harness.transport.agents).toHaveLength(0);
  });

  it("refuses a cookie the API does not recognise", async () => {
    harness = await startHarness();
    const client = harness.connect({ cookie: "session-id=forged" });
    expect(await client.closed()).toBe(CloseCode.unauthenticated);
    expect(harness.api.minted).toHaveLength(0);
  });

  it("refuses a user who is not a member of the workspace", async () => {
    harness = await startHarness();
    const client = harness.connect({ cookie: OUTSIDER_COOKIE });
    expect(await client.closed()).toBe(CloseCode.forbidden);
    expect(harness.transport.agents).toHaveLength(0);
  });

  it("refuses a disabled or unknown agent", async () => {
    harness = await startHarness();
    const client = harness.connect({ agent: DISABLED_AGENT_ID });
    expect(await client.closed()).toBe(CloseCode.agentNotFound);
    expect(harness.transport.agents).toHaveLength(0);
  });

  it("reports a wrong bridge secret as a server problem, not a membership one", async () => {
    const api = await new StubPlaneApi().start();
    const log = new RecordingLogger();
    const bridge = new AgentBridge({
      config: testConfig({ apiBaseUrl: api.url }),
      api: createPlaneApi({ baseUrl: api.url, bridgeSecret: "wrong" }),
      transport: new FakeTransport(),
      log,
    });
    const { port } = await bridge.listen(0, "127.0.0.1");
    try {
      const client = new RawClient(`ws://127.0.0.1:${port}/agents/acp?agent=${AGENT_ID}&workspace=${WORKSPACE_SLUG}`, {
        Cookie: USER_COOKIE,
        Origin: ORIGIN,
      });
      expect(await client.closed()).toBe(CloseCode.internalError);
      expect(log.text()).toContain("rejected AGENT_BRIDGE_SECRET");
      expect(api.minted).toHaveLength(0);
    } finally {
      await bridge.close();
      await api.stop();
    }
  });

  it("refuses malformed query parameters before calling the API", async () => {
    harness = await startHarness();
    expect(await harness.connect({ agent: "not-a-uuid" }).closed()).toBe(CloseCode.badRequest);
    expect(await harness.connect({ workspace: "../etc" }).closed()).toBe(CloseCode.badRequest);
    expect(harness.api.minted).toHaveLength(0);
  });

  it("refuses a cross-origin upgrade at the HTTP level", async () => {
    harness = await startHarness();
    const client = harness.connect({ origin: "https://evil.example" });
    await client.closed();
    expect(client.unexpectedStatus).toBe(403);
    expect(harness.api.minted).toHaveLength(0);
  });

  it("allows the bridge's own host when no origins are configured", async () => {
    harness = await startHarness({ config: { allowedOrigins: [] } });
    const port = new URL(harness.baseUrl).port;
    const same = await harness.open({ origin: `http://127.0.0.1:${port}` });
    expect(same.closeCode).toBeUndefined();
    const other = harness.connect({ origin: "http://plane.test" });
    await other.closed();
    expect(other.unexpectedStatus).toBe(403);
  });

  it("caps connections per user and frees the slot on disconnect", async () => {
    harness = await startHarness({ config: { maxConnectionsPerUser: 1 } });
    const first = await harness.open();
    const second = harness.connect();
    expect(await second.closed()).toBe(CloseCode.tooManyConnections);
    expect(harness.api.minted).toHaveLength(1);
    first.socket.close();
    await waitUntil(() => harness!.bridge.connectionCount === 0);
    const third = await harness.open();
    expect((await initialize(third)).result).toBeDefined();
  });

  it("revokes the token when the runner is unavailable", async () => {
    harness = await startHarness();
    harness.transport.fail = true;
    const client = harness.connect();
    expect(await client.closed()).toBe(CloseCode.agentUnavailable);
    await waitUntil(() => harness!.api.revoked.length === 1);
    expect(harness.api.revoked).toEqual([harness.api.minted[0]!.tokenId]);
  });

  it("never logs the token, the agent env or the cookie", async () => {
    harness = await startHarness();
    const client = await harness.open();
    await initialize(client);
    await client.request("session/new", { cwd: "/", mcpServers: [] });
    client.socket.close();
    await waitUntil(() => harness!.api.revoked.length === 1);
    const logged = harness.log.text();
    expect(logged).toContain("session opened");
    expect(logged).not.toContain(harness.api.minted[0]!.token);
    expect(logged).not.toContain("sk-ant-never-log-me");
    expect(logged).not.toContain("user-session");
  });
});
