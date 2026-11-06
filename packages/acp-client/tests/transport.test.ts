/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { WebSocketConstructor } from "@agentclientprotocol/sdk/experimental/ws-client";
import { describe, expect, it } from "vitest";

import { AgentCloseCode, describeClose } from "../src/close-codes.ts";
import { agentSocketUrl, openWebSocketTransport } from "../src/transport.ts";

/**
 * A browser-shaped WebSocket (EventTarget, `readyState`, CloseEvent-like close), the API the SDK
 * stream drives in the browser. Tests play the server through `serverSend` / `serverClose`.
 */
class FakeBrowserSocket extends EventTarget {
  static instances: FakeBrowserSocket[] = [];
  readyState = 0;
  readonly sent: string[] = [];
  readonly url: string;

  constructor(url: string) {
    super();
    this.url = url;
    FakeBrowserSocket.instances.push(this);
  }

  send(data: string): void {
    if (this.readyState !== 1) throw new Error("InvalidStateError: not open");
    this.sent.push(data);
  }

  close(code = 1000, reason = ""): void {
    this.serverClose(code, reason);
  }

  open(): void {
    this.readyState = 1;
    this.dispatchEvent(new Event("open"));
  }

  serverSend(message: unknown): void {
    this.dispatchEvent(Object.assign(new Event("message"), { data: JSON.stringify(message) }));
  }

  serverClose(code: number, reason = "", wasClean = true): void {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.dispatchEvent(Object.assign(new Event("close"), { code, reason, wasClean }));
  }
}

const Ctor = FakeBrowserSocket as unknown as WebSocketConstructor;
const latest = () => FakeBrowserSocket.instances[FakeBrowserSocket.instances.length - 1]!;

describe("openWebSocketTransport", () => {
  it("queues writes until the socket opens, then sends JSON text frames", async () => {
    const transport = openWebSocketTransport("ws://bridge/agents/acp?agent=a&workspace=w", { WebSocket: Ctor });
    const socket = latest();
    expect(socket.url).toBe("ws://bridge/agents/acp?agent=a&workspace=w");
    const writer = transport.stream.writable.getWriter();
    const write = writer.write({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: 1 } });
    expect(socket.sent).toEqual([]);
    socket.open();
    await write;
    expect(socket.sent.map((frame) => JSON.parse(frame))).toEqual([
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: 1 } },
    ]);
  });

  it("reads server frames as messages", async () => {
    const transport = openWebSocketTransport("ws://bridge/acp", { WebSocket: Ctor });
    const socket = latest();
    socket.open();
    const reader = transport.stream.readable.getReader();
    socket.serverSend({ jsonrpc: "2.0", id: 1, result: { ok: true } });
    expect((await reader.read()).value).toEqual({ jsonrpc: "2.0", id: 1, result: { ok: true } });
  });

  it("reports the bridge's close code and ends the stream", async () => {
    const transport = openWebSocketTransport("ws://bridge/acp", { WebSocket: Ctor });
    const socket = latest();
    socket.open();
    const reader = transport.stream.readable.getReader();
    socket.serverClose(AgentCloseCode.sessionExpired, "token expired");
    expect(await transport.closed).toEqual({ code: 4410, reason: "token expired", wasClean: true });
    expect((await reader.read()).done).toBe(true);
  });

  it("reports an abnormal close when the upgrade is refused", async () => {
    const transport = openWebSocketTransport("ws://bridge/acp", { WebSocket: Ctor });
    const socket = latest();
    socket.dispatchEvent(new Event("error"));
    socket.serverClose(AgentCloseCode.abnormal, "", false);
    expect(await transport.closed).toEqual({ code: 1006, reason: "", wasClean: false });
  });

  it("closes the socket with a code", async () => {
    const transport = openWebSocketTransport("ws://bridge/acp", { WebSocket: Ctor });
    latest().open();
    transport.close(1000, "bye");
    expect(await transport.closed).toMatchObject({ code: 1000, reason: "bye" });
  });
});

describe("agentSocketUrl", () => {
  it("uses the page origin and the default /agents path", () => {
    expect(agentSocketUrl({ agentId: "a1", workspaceSlug: "acme", pageUrl: "https://plane.test/acme/agents" })).toBe(
      "wss://plane.test/agents/acp?agent=a1&workspace=acme"
    );
  });

  it("uses an explicit bridge base URL and path", () => {
    expect(
      agentSocketUrl({
        baseUrl: "http://localhost:3400",
        basePath: "/bridge/",
        agentId: "a b",
        workspaceSlug: "w",
      })
    ).toBe("ws://localhost:3400/bridge/acp?agent=a+b&workspace=w");
  });
});

describe("describeClose", () => {
  it("auto-reconnects only on token expiry", () => {
    expect(describeClose(4410)).toEqual({ reason: "session_expired", canReconnect: true, autoReconnect: true });
    expect(describeClose(4408)).toMatchObject({ reason: "idle_timeout", canReconnect: true, autoReconnect: false });
    expect(describeClose(4403)).toMatchObject({ reason: "forbidden", canReconnect: false });
    expect(describeClose(4999)).toMatchObject({ reason: "unknown", canReconnect: true });
  });
});
