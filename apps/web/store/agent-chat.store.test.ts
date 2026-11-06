/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { when } from "mobx";
import { describe, expect, it, vi } from "vitest";
import { AgentChatSession, AgentCloseCode } from "@plane/acp-client";
import { createFakeAgent, memoryTransport } from "@plane/acp-client/testing";
import type { FakeAgentOptions, MemoryTransport } from "@plane/acp-client/testing";
import type { TWorkspaceAgent } from "@plane/types";
import { AgentChatStore } from "./agent-chat.store";

const AGENTS: TWorkspaceAgent[] = [
  {
    id: "agent-1",
    name: "Claude",
    slug: "claude",
    description: "",
    adapter: "claude",
    default_permission_level: "ask_writes",
    max_permission_level: "ask_writes",
  },
  {
    id: "agent-2",
    name: "Codex",
    slug: "codex",
    description: "",
    adapter: "codex",
    default_permission_level: "ask_all",
    max_permission_level: "yolo",
  },
];

function setup(options: FakeAgentOptions = {}) {
  const fake = createFakeAgent({ maxMode: "ask_writes", ...options });
  const transports: MemoryTransport[] = [];
  const targets: { agentId: string; workspaceSlug: string }[] = [];
  const list = vi.fn(async () => AGENTS);
  const store = new AgentChatStore({
    agentService: { list },
    createSession: (target) => {
      targets.push(target);
      return new AgentChatSession({
        transport: () => {
          const transport = memoryTransport(fake.app());
          transports.push(transport);
          return transport;
        },
      });
    },
  });
  return { store, fake, list, targets, current: () => transports[transports.length - 1]! };
}

async function openReady(options: FakeAgentOptions = {}) {
  const context = setup(options);
  await context.store.fetchAgents("acme");
  await context.store.openChat("acme", "agent-1");
  return context;
}

const texts = (store: AgentChatStore) =>
  (store.snapshot?.transcript.items ?? []).map((item) =>
    item.kind === "message" ? `${item.role}:${item.text}` : item.kind
  );

describe("AgentChatStore", () => {
  it("loads the workspace's agents", async () => {
    const { store, list } = setup();
    await store.fetchAgents("acme");
    expect(list).toHaveBeenCalledWith("acme");
    expect(store.getWorkspaceAgents("acme")).toEqual(AGENTS);
    expect(store.agentsLoading).toBe(false);
  });

  it("flags a failed agent list", async () => {
    const store = new AgentChatStore({ agentService: { list: () => Promise.reject(new Error("nope")) } });
    await expect(store.fetchAgents("acme")).rejects.toThrow("nope");
    expect(store.agentsError).toBe(true);
  });

  it("opens a chat: connects, starts a session and exposes it", async () => {
    const { store, targets } = await openReady();
    expect(targets).toEqual([{ agentId: "agent-1", workspaceSlug: "acme" }]);
    expect(store.snapshot?.status).toBe("ready");
    expect(store.snapshot?.sessionId).toBeTruthy();
    expect(store.activeAgent?.name).toBe("Claude");
    expect(store.canPrompt).toBe(true);
    expect(store.modelConfig?.id).toBe("model");
    expect(store.supportsLoad).toBe(true);
  });

  it("sends a prompt and mirrors the transcript", async () => {
    const { store } = await openReady();
    await store.sendPrompt("  hello  ");
    expect(texts(store)).toEqual(["user:hello", "thought", "agent:hello"]);
    expect(store.error).toBeNull();
    await store.sendPrompt("   ");
    expect(texts(store)).toHaveLength(3);
  });

  it("answers a permission prompt", async () => {
    const { store } = await openReady();
    const turn = store.sendPrompt("/tool");
    await when(() => (store.snapshot?.permissions.length ?? 0) > 0);
    expect(store.canPrompt).toBe(false);
    store.respondToPermission(store.snapshot!.permissions[0]!.id, "reject_once");
    await turn;
    expect(texts(store)).toEqual(["user:/tool", "tool_call", "agent:denied"]);
  });

  it("stops a running turn", async () => {
    const { store, fake } = await openReady();
    const turn = store.sendPrompt("/sleep");
    await when(() => !!store.snapshot?.prompting);
    await store.cancelTurn();
    await turn;
    expect(fake.log.cancelled).toHaveLength(1);
    expect(store.snapshot?.prompting).toBe(false);
    expect(store.snapshot?.transcript.items.at(-1)).toMatchObject({ kind: "turn_end", stopReason: "cancelled" });
  });

  it("reports a permission level above the maximum and keeps the current one", async () => {
    const { store } = await openReady();
    await store.setPermissionLevel("yolo");
    expect(store.error).toEqual({ kind: "mode_not_allowed", modeId: "yolo" });
    expect(store.snapshot?.transcript.modes?.currentModeId).toBe("ask_writes");
    store.clearError();
    await store.setPermissionLevel("ask_all");
    expect(store.error).toBeNull();
    expect(store.snapshot?.transcript.modes?.currentModeId).toBe("ask_all");
  });

  it("changes the model", async () => {
    const { store } = await openReady();
    await store.setModel("smart");
    expect(store.modelConfig?.type === "select" && store.modelConfig.currentValue).toBe("smart");
  });

  it("keeps the permission level for a new chat", async () => {
    const { store, fake } = await openReady();
    await store.setPermissionLevel("ask_all");
    await store.startNewSession();
    expect(fake.log.newSession.at(-1)?._meta).toEqual({ "plane/initialModeId": "ask_all" });
  });

  it("lists and loads earlier sessions when the agent supports it", async () => {
    const { store } = await openReady({ listSessions: true });
    const first = store.snapshot!.sessionId!;
    await store.sendPrompt("hello");
    await store.startNewSession();
    await when(() => store.sessions.length === 2);
    await store.loadSession(first);
    expect(store.snapshot?.sessionId).toBe(first);
    expect(texts(store)).toEqual(["user:hello", "thought", "agent:hello"]);
  });

  it("shows a bridge close code and no extra error", async () => {
    const { store, current } = await openReady();
    current().closeWith(AgentCloseCode.forbidden);
    await when(() => store.snapshot?.status === "closed");
    expect(store.snapshot?.close?.code).toBe(4403);
    await store.sendPrompt("hello");
    expect(store.error).toBeNull();
  });

  it("resumes the same session after a 4410", async () => {
    const { store, current, fake } = await openReady();
    const sessionId = store.snapshot?.sessionId;
    await store.sendPrompt("hello");
    current().closeWith(AgentCloseCode.sessionExpired);
    await when(() => store.snapshot?.status === "reconnecting");
    await when(() => store.snapshot?.status === "ready");
    expect(fake.log.loaded).toEqual([sessionId]);
    expect(texts(store)).toEqual(["user:hello", "thought", "agent:hello"]);
  });

  it("reconnects by hand after an idle timeout", async () => {
    const { store, current } = await openReady();
    current().closeWith(AgentCloseCode.idleTimeout);
    await when(() => store.snapshot?.status === "closed");
    await store.reconnect();
    expect(store.snapshot?.status).toBe("ready");
    expect(store.error).toBeNull();
  });

  it("switching agents closes the previous chat", async () => {
    const { store, current, targets } = await openReady();
    const previous = current();
    let closedCode: number | undefined;
    void previous.closed.then((info) => (closedCode = info.code));
    await store.openChat("acme", "agent-2");
    expect(closedCode).toBe(1000);
    expect(targets.map((target) => target.agentId)).toEqual(["agent-1", "agent-2"]);
    expect(store.activeAgent?.name).toBe("Codex");
  });

  it("closeChat drops the chat", async () => {
    const { store } = await openReady();
    store.closeChat();
    expect(store.snapshot).toBeNull();
    expect(store.agentId).toBeNull();
    expect(store.canPrompt).toBe(false);
  });
});
