/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import type { TCopilotStreamEvent } from "@plane/types";
import { CopilotStore } from "@/store/copilot.store";

const messageDelta = (sequence: number, messageId: string, delta: string, done = false): TCopilotStreamEvent => ({
  event: "message_delta",
  data: { sequence, message_id: messageId, delta, done },
});

const toolCallStart = (sequence: number, id: string, awaitingInput = true): TCopilotStreamEvent => ({
  event: "tool_call_start",
  data: { sequence, id, name: "ask_user", args: { questions: [] }, status: "running", awaiting_input: awaitingInput },
});

describe("CopilotStore stream event reducers", () => {
  it("message_delta creates a new assistant message on its first chunk", () => {
    const store = new CopilotStore();

    store.applyStreamEvent(messageDelta(2000, "m1", "Hello", false));

    expect(store.messages).toHaveLength(1);
    expect(store.messages[0].id).toBe("m1");
    expect(store.messages[0].content).toBe("Hello");
    expect(store.lastSequence).toBe(2000);
  });

  it("message_delta appends chunks to an existing message", () => {
    const store = new CopilotStore();

    store.applyStreamEvent(messageDelta(2000, "m1", "Hello", false));
    store.applyStreamEvent(messageDelta(2000, "m1", " world", true));

    expect(store.messages).toHaveLength(1);
    expect(store.messages[0].content).toBe("Hello world");
  });

  it("tool_call_start creates a running tool call", () => {
    const store = new CopilotStore();

    store.applyStreamEvent(toolCallStart(2001, "t1"));

    const toolCall = store.toolCalls["t1"];
    expect(toolCall).toBeDefined();
    expect(toolCall.status).toBe("running");
    expect(toolCall.awaiting_input).toBe(true);
    expect(toolCall.name).toBe("ask_user");
  });

  it("tool_call_update merges a partial result and flags", () => {
    const store = new CopilotStore();
    store.applyStreamEvent(toolCallStart(2001, "t1", false));

    store.applyStreamEvent({
      event: "tool_call_update",
      data: { sequence: 2002, id: "t1", status: "running", stale: true, result: { tickets: [{ id: "i1" }] } },
    } as TCopilotStreamEvent);

    const toolCall = store.toolCalls["t1"];
    expect(toolCall.is_stale).toBe(true);
    expect(toolCall.result).toEqual({ tickets: [{ id: "i1" }] });
  });

  it("tool_call_update on an unknown tool call is a no-op", () => {
    const store = new CopilotStore();

    store.applyStreamEvent({
      event: "tool_call_update",
      data: { sequence: 1, id: "missing", status: "done" },
    } as TCopilotStreamEvent);

    expect(store.toolCalls["missing"]).toBeUndefined();
  });

  it("tool_call_end marks the call done with its result", () => {
    const store = new CopilotStore();
    store.applyStreamEvent(toolCallStart(2001, "t1", false));

    store.applyStreamEvent({
      event: "tool_call_end",
      data: { sequence: 2003, id: "t1", status: "done", result: { answers: {} } },
    } as TCopilotStreamEvent);

    const toolCall = store.toolCalls["t1"];
    expect(toolCall.status).toBe("done");
    expect(toolCall.result).toEqual({ answers: {} });
  });

  it("tool_call_end records an error on failure", () => {
    const store = new CopilotStore();
    store.applyStreamEvent(toolCallStart(2001, "t1", false));

    store.applyStreamEvent({
      event: "tool_call_end",
      data: { sequence: 2003, id: "t1", status: "failed", error: { code: "upstream_error", message: "boom" } },
    } as TCopilotStreamEvent);

    const toolCall = store.toolCalls["t1"];
    expect(toolCall.status).toBe("failed");
    expect(toolCall.error?.code).toBe("upstream_error");
  });
});

describe("CopilotStore state", () => {
  it("hasRunningTurn is true only for a running interactive call awaiting input", () => {
    const store = new CopilotStore();
    expect(store.hasRunningTurn).toBe(false);

    store.applyStreamEvent(toolCallStart(2001, "t1", true));
    expect(store.hasRunningTurn).toBe(true);

    store.applyStreamEvent({
      event: "tool_call_end",
      data: { sequence: 2003, id: "t1", status: "done" },
    } as TCopilotStreamEvent);
    expect(store.hasRunningTurn).toBe(false);
  });

  it("togglePanel flips and sets the open state", () => {
    const store = new CopilotStore();
    expect(store.panelOpen).toBe(false);

    store.togglePanel();
    expect(store.panelOpen).toBe(true);

    store.togglePanel(false);
    expect(store.panelOpen).toBe(false);
  });

  it("setPanelWidth stores the width", () => {
    const store = new CopilotStore();

    store.setPanelWidth(480);

    expect(store.panelWidth).toBe(480);
  });

  it("stop marks running tool calls as cancelled", async () => {
    const store = new CopilotStore();
    // Stub the service call so no network happens.
    (store as unknown as { service: { stopStream: () => Promise<{ cancelled: number }> } }).service = {
      stopStream: async () => ({ cancelled: 1 }),
    };
    store.applyStreamEvent(toolCallStart(2001, "t1", true));
    store.streamStatus = "streaming";

    await store.stop("acme", "project-1", "session-1");

    expect(store.toolCalls["t1"].status).toBe("failed");
    expect(store.toolCalls["t1"].error?.code).toBe("cancelled");
    expect(store.streamStatus).toBe("idle");
  });

  it("reset clears the transcript and panel state", () => {
    const store = new CopilotStore();
    store.applyStreamEvent(messageDelta(2000, "m1", "Hello"));
    store.applyStreamEvent(toolCallStart(2001, "t1"));
    store.togglePanel(true);

    store.reset();

    expect(store.session).toBeNull();
    expect(store.messages).toEqual([]);
    expect(store.toolCalls).toEqual({});
    expect(store.memories).toEqual([]);
    expect(store.streamStatus).toBe("idle");
  });
});
