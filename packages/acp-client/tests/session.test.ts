/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";

import { AgentCloseCode } from "../src/close-codes.ts";
import {
  AgentChatSession,
  AgentDisconnectedError,
  AgentRequestError,
  INVALID_PARAMS,
  type AgentChatSnapshot,
} from "../src/session.ts";
import { effortOption, modelOption, type TranscriptItem } from "../src/transcript.ts";
import { createFakeAgent, type FakeAgentOptions } from "../src/testing/fake-agent.ts";
import { memoryTransport, type MemoryTransport } from "../src/testing/memory-transport.ts";

function setup(options: FakeAgentOptions = {}) {
  const fake = createFakeAgent(options);
  const transports: MemoryTransport[] = [];
  const session = new AgentChatSession({
    transport: () => {
      const transport = memoryTransport(fake.app());
      transports.push(transport);
      return transport;
    },
  });
  return { fake, session, transports, current: () => transports[transports.length - 1]! };
}

/** Resolve once a snapshot satisfies `predicate`. */
function waitFor(session: AgentChatSession, predicate: (snapshot: AgentChatSnapshot) => boolean) {
  return new Promise<AgentChatSnapshot>((resolve, reject) => {
    if (predicate(session.snapshot)) {
      resolve(session.snapshot);
      return;
    }
    const timer = setTimeout(() => reject(new Error("timed out waiting for the session")), 2000);
    const unsubscribe = session.subscribe((snapshot) => {
      if (!predicate(snapshot)) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(snapshot);
    });
  });
}

const summary = (items: readonly TranscriptItem[]) =>
  items.map((item) => {
    switch (item.kind) {
      case "message":
        return `${item.role}:${item.text}`;
      case "thought":
        return `thought:${item.text}`;
      case "tool_call":
        return `tool:${item.toolCallId}:${item.status}`;
      case "turn_end":
        return `end:${item.stopReason}`;
      case "notice":
        return `notice:${item.code ?? item.title}`;
      default:
        return item.kind;
    }
  });

async function ready(options: FakeAgentOptions = {}) {
  const context = setup(options);
  await context.session.connect();
  await context.session.newSession();
  return context;
}

describe("AgentChatSession: connect and sessions", () => {
  it("initializes as an ACP client with notices and no fs/terminal", async () => {
    const { session, fake } = setup();
    const result = await session.connect();
    expect(result.agentInfo?.name).toBe("fake-agent");
    expect(fake.log.initialize[0]?.clientCapabilities).toMatchObject({
      fs: { readTextFile: false, writeTextFile: false },
      terminal: false,
      session: { notices: {} },
    });
    expect(session.snapshot.status).toBe("ready");
    expect(session.supportsLoad).toBe(true);
  });

  it("starts a session with cwd '/', no MCP servers and the requested mode", async () => {
    const { session, fake } = setup();
    await session.connect();
    const sessionId = await session.newSession({ initialModeId: "ask_all" });
    expect(fake.log.newSession[0]).toEqual({ cwd: "/", mcpServers: [], _meta: { "plane/initialModeId": "ask_all" } });
    expect(session.snapshot.sessionId).toBe(sessionId);
    expect(session.snapshot.transcript.modes?.currentModeId).toBe("ask_all");
    expect(modelOption(session.snapshot.transcript)?.id).toBe("model");
  });

  it("lists sessions when the agent supports it", async () => {
    const { session } = await ready({ listSessions: true });
    expect(session.supportsList).toBe(true);
    const listed = await session.listSessions();
    expect(listed.sessions.map((entry) => entry.sessionId)).toEqual([session.snapshot.sessionId]);
  });

  it("loads a session by replaying its history", async () => {
    const { session } = await ready();
    const sessionId = session.snapshot.sessionId!;
    await session.prompt("hello");
    await session.newSession();
    expect(session.snapshot.transcript.items).toEqual([]);
    await session.loadSession(sessionId);
    expect(summary(session.snapshot.transcript.items)).toEqual([
      "user:hello",
      "thought:mode ask_writes",
      "agent:hello",
    ]);
  });
});

describe("AgentChatSession: prompts", () => {
  it("streams a turn into the transcript", async () => {
    const { session } = await ready();
    const stop = await session.prompt("hello");
    expect(stop).toBe("end_turn");
    expect(summary(session.snapshot.transcript.items)).toEqual([
      "user:hello",
      "thought:mode ask_writes",
      "agent:hello",
    ]);
    expect(session.snapshot.prompting).toBe(false);
  });

  it("allows a tool call through the permission prompt", async () => {
    const { session } = await ready();
    const turn = session.prompt("/tool");
    const { permissions } = await waitFor(session, (snapshot) => snapshot.permissions.length === 1);
    expect(permissions[0]?.options.map((option) => option.optionId)).toEqual([
      "allow_once",
      "allow_always",
      "reject_once",
    ]);
    expect(permissions[0]?.toolCall.toolCallId).toBe("t1");
    session.respondToPermission(permissions[0]!.id, "allow_once");
    expect(await turn).toBe("end_turn");
    expect(session.snapshot.permissions).toEqual([]);
    expect(summary(session.snapshot.transcript.items)).toEqual(["user:/tool", "tool:t1:completed", "agent:allowed"]);
  });

  it("denies a tool call through the permission prompt", async () => {
    const { session } = await ready();
    const turn = session.prompt("/tool");
    const { permissions } = await waitFor(session, (snapshot) => snapshot.permissions.length === 1);
    session.respondToPermission(permissions[0]!.id, "reject_once");
    expect(await turn).toBe("end_turn");
    expect(summary(session.snapshot.transcript.items)).toEqual(["user:/tool", "tool:t1:failed", "agent:denied"]);
  });

  it("cancels a turn that waits on a permission prompt", async () => {
    const { session, fake } = await ready();
    const turn = session.prompt("/tool");
    await waitFor(session, (snapshot) => snapshot.permissions.length === 1);
    await session.cancel();
    expect(session.snapshot.permissions).toEqual([]);
    expect(await turn).toBe("cancelled");
    expect(fake.log.cancelled).toEqual([session.snapshot.sessionId]);
    expect(summary(session.snapshot.transcript.items).at(-1)).toBe("end:cancelled");
  });

  it("stops a running turn with session/cancel", async () => {
    const { session } = await ready();
    const turn = session.prompt("/sleep");
    await waitFor(session, (snapshot) => snapshot.prompting);
    await session.cancel();
    expect(await turn).toBe("cancelled");
    expect(session.snapshot.prompting).toBe(false);
  });

  it("marks a failed turn and rethrows the agent's error", async () => {
    const { session } = await ready();
    await expect(session.prompt("/fail")).rejects.toMatchObject({ code: -32603 });
    expect(summary(session.snapshot.transcript.items).at(-1)).toBe("end:failed");
  });
});

describe("AgentChatSession: modes and models", () => {
  it("switches to an allowed mode", async () => {
    const { session } = await ready({ maxMode: "ask_writes" });
    await session.setMode("ask_all");
    expect(session.snapshot.transcript.modes?.currentModeId).toBe("ask_all");
  });

  it("surfaces -32602 for a mode above the maximum and keeps the current mode", async () => {
    const { session } = await ready({ maxMode: "ask_writes" });
    expect(session.snapshot.transcript.modes?.availableModes.map((mode) => mode.id)).toEqual(["ask_all", "ask_writes"]);
    const error = await session.setMode("yolo").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AgentRequestError);
    expect((error as AgentRequestError).code).toBe(INVALID_PARAMS);
    expect(session.snapshot.transcript.modes?.currentModeId).toBe("ask_writes");
    expect(session.snapshot.status).toBe("ready");
  });

  it("changes the model through the model config option", async () => {
    const { session } = await ready();
    await session.setModel("smart");
    const option = modelOption(session.snapshot.transcript);
    expect(option?.type === "select" && option.currentValue).toBe("smart");
  });

  it("changes the effort through the thought_level option, which only models that take one have", async () => {
    const { session } = await ready();
    expect(effortOption(session.snapshot.transcript)).toBeUndefined();
    await expect(session.setEffort("high")).rejects.toMatchObject({ code: INVALID_PARAMS });
    await session.setModel("smart");
    expect(effortOption(session.snapshot.transcript)?.currentValue).toBe("medium");
    await session.setEffort("high");
    expect(effortOption(session.snapshot.transcript)?.currentValue).toBe("high");
  });

  it("reloads on the same model and effort after a 4410, and keeps them through a failed load", async () => {
    const { session, fake, current } = await ready();
    await session.setModel("smart");
    await session.setEffort("high");
    current().closeWith(AgentCloseCode.sessionExpired);
    await waitFor(session, (snapshot) => snapshot.status === "reconnecting");
    await waitFor(session, (snapshot) => snapshot.status === "ready");
    expect(fake.log.loadRequests.at(-1)?._meta).toEqual({
      "plane/initialModel": "smart",
      "plane/initialEffort": "high",
    });
    expect(effortOption(session.snapshot.transcript)?.currentValue).toBe("high");

    // A failed load empties the transcript, but not the choices a new chat starts on.
    await expect(session.loadSession("missing")).rejects.toBeInstanceOf(AgentRequestError);
    expect(modelOption(session.snapshot.transcript)).toBeUndefined();
    expect(session.choices).toEqual({ initialModel: "smart", initialEffort: "high" });
    await session.newSession(session.choices);
    expect(effortOption(session.snapshot.transcript)?.currentValue).toBe("high");
  });

  it("starts a session on the requested model and effort, and keeps them across a reconnect", async () => {
    const { session, fake, current } = await ready({ loadSession: false });
    await session.newSession({ initialModeId: "ask_all", initialModel: "smart", initialEffort: "low" });
    expect(fake.log.newSession.at(-1)?._meta).toEqual({
      "plane/initialModeId": "ask_all",
      "plane/initialModel": "smart",
      "plane/initialEffort": "low",
    });
    expect(modelOption(session.snapshot.transcript)?.currentValue).toBe("smart");
    expect(effortOption(session.snapshot.transcript)?.currentValue).toBe("low");

    current().closeWith(AgentCloseCode.agentUnavailable);
    await waitFor(session, (snapshot) => snapshot.status === "closed");
    expect(await session.reconnect()).toEqual({ resumed: false });
    expect(fake.log.newSession.at(-1)?._meta).toEqual({
      "plane/initialModeId": "ask_all",
      "plane/initialModel": "smart",
      "plane/initialEffort": "low",
    });
    expect(effortOption(session.snapshot.transcript)?.currentValue).toBe("low");
  });
});

describe("AgentChatSession: close codes and reconnects", () => {
  it("reconnects after 4410 and reloads the same session", async () => {
    const { session, fake, transports, current } = await ready();
    const sessionId = session.snapshot.sessionId;
    await session.prompt("hello");
    current().closeWith(AgentCloseCode.sessionExpired);
    await waitFor(session, (snapshot) => snapshot.status === "reconnecting");
    await waitFor(session, (snapshot) => snapshot.status === "ready" && snapshot.transcript.items.length === 3);
    expect(transports).toHaveLength(2);
    expect(fake.log.initialize).toHaveLength(2);
    expect(fake.log.loaded).toEqual([sessionId]);
    expect(session.snapshot.sessionId).toBe(sessionId);
    expect(session.snapshot.close).toBeNull();
    expect(summary(session.snapshot.transcript.items)).toEqual([
      "user:hello",
      "thought:mode ask_writes",
      "agent:hello",
    ]);
    // The resumed session keeps working.
    expect(await session.prompt("again")).toBe("end_turn");
  });

  it("fails an in-flight turn on 4410, then resumes", async () => {
    const { session, current } = await ready();
    const turn = session.prompt("/sleep");
    await waitFor(session, (snapshot) => snapshot.prompting);
    current().closeWith(AgentCloseCode.sessionExpired);
    await expect(turn).rejects.toBeInstanceOf(AgentDisconnectedError);
    await waitFor(session, (snapshot) => snapshot.status === "ready");
    expect(session.snapshot.prompting).toBe(false);
  });

  it("does not reconnect on 4410 when the agent cannot load sessions", async () => {
    const { session, transports, current } = await ready({ loadSession: false });
    current().closeWith(AgentCloseCode.sessionExpired);
    const snapshot = await waitFor(session, (state) => state.status === "closed");
    expect(snapshot.close?.code).toBe(AgentCloseCode.sessionExpired);
    expect(transports).toHaveLength(1);
  });

  it("closes on other codes and fails the running turn as disconnected", async () => {
    const { session, current } = await ready();
    const turn = session.prompt("/tool");
    await waitFor(session, (snapshot) => snapshot.permissions.length === 1);
    current().closeWith(AgentCloseCode.idleTimeout, "idle");
    const error = await turn.catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AgentDisconnectedError);
    expect((error as AgentDisconnectedError).close?.code).toBe(AgentCloseCode.idleTimeout);
    expect(session.snapshot).toMatchObject({ status: "closed", prompting: false, permissions: [] });
    expect(session.snapshot.close).toMatchObject({ code: AgentCloseCode.idleTimeout, reason: "idle" });
    expect(summary(session.snapshot.transcript.items).at(-1)).toBe("end:disconnected");
    await expect(session.prompt("hi")).rejects.toBeInstanceOf(AgentDisconnectedError);
  });

  it("reports the close code when the bridge refuses the connection", async () => {
    const fake = createFakeAgent();
    const session = new AgentChatSession({
      transport: () => {
        const transport = memoryTransport(fake.app());
        queueMicrotask(() => transport.closeWith(AgentCloseCode.unauthenticated));
        return transport;
      },
    });
    const error = await session.connect().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AgentDisconnectedError);
    expect((error as AgentDisconnectedError).close?.code).toBe(AgentCloseCode.unauthenticated);
    expect(session.snapshot.status).toBe("closed");
    expect(session.snapshot.close?.code).toBe(AgentCloseCode.unauthenticated);
  });

  it("reconnects by hand into a new session when the agent cannot load", async () => {
    const { session, current } = await ready({ loadSession: false });
    await session.prompt("hello");
    await session.prompt("/plan");
    expect(session.snapshot.transcript.plan).not.toBeNull();
    const before = session.snapshot.sessionId;
    current().closeWith(AgentCloseCode.agentUnavailable);
    await waitFor(session, (snapshot) => snapshot.status === "closed");
    expect(await session.reconnect()).toEqual({ resumed: false });
    expect(session.snapshot.sessionId).not.toBe(before);
    expect(summary(session.snapshot.transcript.items)).toEqual([
      "user:hello",
      "thought:mode ask_writes",
      "agent:hello",
      "user:/plan",
      "notice:new_session",
    ]);
    expect(session.snapshot.transcript.plan).toBeNull();
    expect(session.snapshot.transcript.usage).toBeNull();
  });

  it("ignores the old socket's close after dispose", async () => {
    const { session, current } = await ready();
    session.dispose();
    current().closeWith(AgentCloseCode.sessionExpired);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(session.snapshot.status).toBe("closed");
  });
});
