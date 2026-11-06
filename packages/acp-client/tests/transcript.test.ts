/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { SessionConfigOption, SessionUpdate } from "@agentclientprotocol/sdk";
import { describe, expect, it } from "vitest";

import {
  appendNotice,
  appendTurnEnd,
  appendUserPrompt,
  applyModeChange,
  applySessionSetup,
  applySessionUpdate,
  createTranscript,
  modelOption,
  selectChoices,
  type TranscriptState,
} from "../src/transcript.ts";

const text = (value: string) => ({ type: "text" as const, text: value });
const apply = (updates: SessionUpdate[], state: TranscriptState = createTranscript()) =>
  updates.reduce(applySessionUpdate, state);

const MODEL: SessionConfigOption = {
  id: "model",
  name: "Model",
  category: "model",
  type: "select",
  currentValue: "a",
  options: [
    { value: "a", name: "A" },
    { value: "b", name: "B", description: "bigger" },
  ],
};

describe("applySessionUpdate: messages and thoughts", () => {
  it("merges agent chunks of one message and starts a new message on a new messageId", () => {
    const state = apply([
      { sessionUpdate: "agent_message_chunk", messageId: "m1", content: text("Hel") },
      { sessionUpdate: "agent_message_chunk", messageId: "m1", content: text("lo") },
      { sessionUpdate: "agent_message_chunk", messageId: "m2", content: text("Next") },
    ]);
    expect(state.items).toEqual([
      { kind: "message", id: "i1", role: "agent", messageId: "m1", text: "Hello", attachments: [] },
      { kind: "message", id: "i2", role: "agent", messageId: "m2", text: "Next", attachments: [] },
    ]);
  });

  it("merges chunks without messageIds, and separates thoughts from messages", () => {
    const state = apply([
      { sessionUpdate: "agent_thought_chunk", content: text("think ") },
      { sessionUpdate: "agent_thought_chunk", content: text("more") },
      { sessionUpdate: "agent_message_chunk", content: text("a") },
      { sessionUpdate: "agent_message_chunk", content: text("b") },
    ]);
    expect(state.items.map((item) => [item.kind, "text" in item ? item.text : ""])).toEqual([
      ["thought", "think more"],
      ["message", "ab"],
    ]);
  });

  it("replays user chunks (session/load) as user messages", () => {
    const state = apply([
      { sessionUpdate: "user_message_chunk", content: text("hi") },
      { sessionUpdate: "agent_message_chunk", content: text("hello") },
      { sessionUpdate: "user_message_chunk", content: text("again") },
    ]);
    expect(state.items.map((item) => (item.kind === "message" ? `${item.role}:${item.text}` : item.kind))).toEqual([
      "user:hi",
      "agent:hello",
      "user:again",
    ]);
  });

  it("keeps non-text content as attachments", () => {
    const link = { type: "resource_link" as const, uri: "https://x/y", name: "y" };
    const state = apply([
      { sessionUpdate: "agent_message_chunk", content: text("see ") },
      { sessionUpdate: "agent_message_chunk", content: link },
    ]);
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ text: "see ", attachments: [link] });
  });

  it("starts a new message after a tool call", () => {
    const state = apply([
      { sessionUpdate: "agent_message_chunk", content: text("a") },
      { sessionUpdate: "tool_call", toolCallId: "t", title: "Read" },
      { sessionUpdate: "agent_message_chunk", content: text("b") },
    ]);
    expect(state.items.map((item) => item.kind)).toEqual(["message", "tool_call", "message"]);
  });
});

describe("applySessionUpdate: tool calls", () => {
  it("tracks a tool call by toolCallId through its updates", () => {
    const state = apply([
      { sessionUpdate: "tool_call", toolCallId: "t1", title: "Run ls", kind: "execute", rawInput: { command: "ls" } },
      { sessionUpdate: "tool_call", toolCallId: "t2", title: "Read a", kind: "read", status: "in_progress" },
      { sessionUpdate: "tool_call_update", toolCallId: "t1", status: "in_progress" },
      {
        sessionUpdate: "tool_call_update",
        toolCallId: "t1",
        status: "completed",
        title: null,
        content: [{ type: "content", content: text("a\nb") }],
        rawOutput: { exit: 0 },
      },
    ]);
    expect(state.toolCalls).toEqual({ t1: 0, t2: 1 });
    expect(state.items[0]).toEqual({
      kind: "tool_call",
      id: "i1",
      toolCallId: "t1",
      title: "Run ls",
      toolKind: "execute",
      status: "completed",
      content: [{ type: "content", content: text("a\nb") }],
      locations: [],
      rawInput: { command: "ls" },
      rawOutput: { exit: 0 },
    });
    expect(state.items[1]).toMatchObject({ toolCallId: "t2", status: "in_progress", toolKind: "read" });
  });

  it("creates a card for an update whose tool_call was never seen", () => {
    const state = apply([{ sessionUpdate: "tool_call_update", toolCallId: "x", title: "Edit", kind: "edit" }]);
    expect(state.items[0]).toMatchObject({ kind: "tool_call", toolCallId: "x", title: "Edit", status: "pending" });
  });

  it("does not mutate the previous state", () => {
    const before = apply([{ sessionUpdate: "tool_call", toolCallId: "t", title: "A" }]);
    const snapshot = JSON.stringify(before);
    applySessionUpdate(before, { sessionUpdate: "tool_call_update", toolCallId: "t", status: "failed" });
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe("applySessionUpdate: session state", () => {
  it("replaces the plan", () => {
    const state = apply([
      { sessionUpdate: "plan", entries: [{ content: "a", priority: "high", status: "pending" }] },
      {
        sessionUpdate: "plan",
        entries: [
          { content: "a", priority: "high", status: "completed" },
          { content: "b", priority: "low", status: "in_progress" },
        ],
      },
    ]);
    expect(state.plan?.map((entry) => `${entry.content}:${entry.status}`)).toEqual(["a:completed", "b:in_progress"]);
    expect(state.items).toEqual([]);
  });

  it("records usage", () => {
    const state = apply([
      { sessionUpdate: "usage_update", used: 10, size: 100 },
      { sessionUpdate: "usage_update", used: 42, size: 1000, cost: { amount: 0.5, currency: "USD" } },
    ]);
    expect(state.usage).toEqual({ used: 42, size: 1000, cost: { amount: 0.5, currency: "USD" } });
  });

  it("tracks the current mode", () => {
    const start = createTranscript({
      modes: {
        currentModeId: "ask_writes",
        availableModes: [
          { id: "ask_all", name: "A" },
          { id: "ask_writes", name: "W" },
        ],
      },
    });
    const state = apply([{ sessionUpdate: "current_mode_update", currentModeId: "ask_all" }], start);
    expect(state.modes?.currentModeId).toBe("ask_all");
    expect(state.modes?.availableModes).toHaveLength(2);
    expect(applyModeChange(createTranscript(), "yolo").modes).toEqual({ currentModeId: "yolo", availableModes: [] });
  });

  it("replaces config options, commands and session info", () => {
    const state = apply([
      { sessionUpdate: "config_option_update", configOptions: [MODEL] },
      { sessionUpdate: "available_commands_update", availableCommands: [{ name: "plan", description: "Plan" }] },
      { sessionUpdate: "session_info_update", title: "Fix bug", updatedAt: "2026-11-06T00:00:00Z" },
      { sessionUpdate: "session_info_update", title: null },
    ]);
    expect(modelOption(state)?.id).toBe("model");
    expect(state.availableCommands.map((command) => command.name)).toEqual(["plan"]);
    expect(state.title).toBeNull();
    expect(state.updatedAt).toBe("2026-11-06T00:00:00Z");
  });

  it("tracks compaction progress and its summary", () => {
    const state = apply([
      { sessionUpdate: "compaction_update", compactionId: "c", status: "in_progress" },
      { sessionUpdate: "compaction_summary_chunk", compactionId: "c", content: text("Sum") },
      { sessionUpdate: "compaction_summary_chunk", compactionId: "c", content: text("mary") },
      { sessionUpdate: "compaction_update", compactionId: "c", status: "completed" },
    ]);
    expect(state.items).toEqual([
      { kind: "compaction", id: "i1", compactionId: "c", status: "completed", summary: "Summary", error: null },
    ]);
  });

  it("ignores update kinds it does not know", () => {
    const state = createTranscript();
    expect(applySessionUpdate(state, { sessionUpdate: "future_thing" } as unknown as SessionUpdate)).toBe(state);
  });
});

describe("applySessionUpdate: notices", () => {
  it("shows a notice update", () => {
    const state = apply([
      { sessionUpdate: "notice", severity: "warning", title: "Plane tools unavailable", description: "No MCP." },
    ]);
    expect(state.items).toEqual([
      {
        kind: "notice",
        id: "i1",
        severity: "warning",
        title: "Plane tools unavailable",
        description: "No MCP.",
        code: null,
      },
    ]);
  });

  it("does not repeat an identical agent notice, but keeps client notices", () => {
    const notice: SessionUpdate = { sessionUpdate: "notice", severity: "warning", title: "T", description: "D" };
    const state = apply([notice, { sessionUpdate: "agent_message_chunk", content: text("hi") }, notice]);
    expect(state.items.map((item) => item.kind)).toEqual(["notice", "message"]);
    const twice = appendNotice(appendNotice(state, "info", "", null, "new_session"), "info", "", null, "new_session");
    expect(twice.items.filter((item) => item.kind === "notice")).toHaveLength(3);
  });

  it("shows the bridge's agent-message fallback as a notice, not a message", () => {
    const state = apply([
      { sessionUpdate: "agent_message_chunk", content: text("hi") },
      {
        sessionUpdate: "agent_message_chunk",
        content: text("Plane tools unavailable: no MCP"),
        _meta: { "plane/notice": true },
      },
      { sessionUpdate: "agent_message_chunk", content: text(" there") },
    ]);
    expect(state.items.map((item) => item.kind)).toEqual(["message", "notice", "message"]);
    expect(state.items[1]).toMatchObject({ severity: "warning", title: "Plane tools unavailable: no MCP" });
  });
});

describe("local transcript events", () => {
  it("records the user's prompt and abnormal turn ends", () => {
    let state = appendUserPrompt(createTranscript(), "hi");
    state = appendTurnEnd(state, "end_turn");
    state = appendTurnEnd(state, "cancelled");
    expect(state.items).toEqual([
      { kind: "message", id: "i1", role: "user", messageId: null, text: "hi", attachments: [] },
      { kind: "turn_end", id: "i2", stopReason: "cancelled" },
    ]);
  });

  it("does not merge an agent reply into the user's prompt", () => {
    const state = applySessionUpdate(appendUserPrompt(createTranscript(), "hi"), {
      sessionUpdate: "agent_message_chunk",
      content: text("hello"),
    });
    expect(state.items).toHaveLength(2);
  });

  it("applies a session/new or load result", () => {
    const state = applySessionSetup(createTranscript(), {
      modes: { currentModeId: "ask_all", availableModes: [] },
      configOptions: [MODEL],
    });
    expect(state.modes?.currentModeId).toBe("ask_all");
    expect(applySessionSetup(state, { configOptions: null }).configOptions).toEqual([MODEL]);
  });

  it("flattens select choices, grouped or not", () => {
    expect(selectChoices(MODEL)).toEqual([
      { value: "a", name: "A", description: null, group: null },
      { value: "b", name: "B", description: "bigger", group: null },
    ]);
    const grouped: SessionConfigOption = {
      ...MODEL,
      type: "select",
      currentValue: "a",
      options: [{ group: "g", name: "Group", options: [{ value: "a", name: "A" }] }],
    };
    expect(selectChoices(grouped)).toEqual([{ value: "a", name: "A", description: null, group: "Group" }]);
    expect(selectChoices(undefined)).toEqual([]);
  });
});
