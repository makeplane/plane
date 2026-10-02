/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { CopilotStreamConnection, SSEParser } from "./copilot-stream";

const data = (overrides = {}) => ({ sequence: 1, ...overrides });

const record = (id: number | null, event: string, payload: object) =>
  `${id === null ? "" : `id: ${id}\n`}event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;

const encoder = new TextEncoder();

const streamFromChunks = (chunks: string[]) => {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunks[index]));
      index += 1;
    },
  });
};

const okResponse = (chunks: string[]) =>
  new Response(streamFromChunks(chunks), { status: 200, headers: { "Content-Type": "text/event-stream" } });

describe("SSEParser", () => {
  it("parses a complete event", () => {
    const parser = new SSEParser();
    const events = parser.push(record(1, "message_delta", data({ delta: "Hi", done: true })));

    expect(events).toEqual([{ id: 1, event: "message_delta", data: data({ delta: "Hi", done: true }) }]);
  });

  it("parses events split across chunks", () => {
    const parser = new SSEParser();
    const full = record(2, "tool_call_start", { sequence: 2, id: "t1", name: "ask_user", args: {}, status: "running" });
    const cut = Math.floor(full.length / 2);

    const first = parser.push(full.slice(0, cut));
    expect(first).toEqual([]);
    const second = parser.push(full.slice(cut));
    expect(second).toHaveLength(1);
    expect(second[0].event).toBe("tool_call_start");
    expect(second[0].id).toBe(2);
  });

  it("parses multiple events in one chunk", () => {
    const parser = new SSEParser();
    const chunk =
      record(1, "message_delta", data()) + record(2, "tool_call_end", { sequence: 2, id: "t1", status: "done" });
    const events = parser.push(chunk);

    expect(events).toHaveLength(2);
    expect(events[0].id).toBe(1);
    expect(events[1].event).toBe("tool_call_end");
  });

  it("skips comment-only keep-alive records", () => {
    const parser = new SSEParser();
    const events = parser.push(": heartbeat\n\n" + record(1, "message_delta", data()));

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("message_delta");
  });

  it("skips records with invalid JSON data", () => {
    const parser = new SSEParser();
    const events = parser.push("id: 1\nevent: message_delta\ndata: not json\n\n");

    expect(events).toEqual([]);
  });

  it("joins multi-line data payloads", () => {
    const parser = new SSEParser();
    const events = parser.push('id: 1\nevent: message_delta\ndata: {"a":\ndata: 1}\n\n');

    expect(events).toHaveLength(1);
    expect(events[0].data).toEqual({ a: 1 });
  });

  it("handles a record with no id", () => {
    const parser = new SSEParser();
    const events = parser.push("event: message_delta\ndata: " + JSON.stringify(data()) + "\n\n");

    expect(events[0].id).toBeNull();
  });
});

describe("CopilotStreamConnection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("opens the stream and dispatches typed events", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        okResponse([
          ": stream open\n\n" +
            record(1, "message_delta", data({ message_id: "m1", delta: "Hi", done: false })) +
            record(1, "message_delta", data({ message_id: "m1", delta: "Hi", done: true })),
        ])
      );
    vi.stubGlobal("fetch", fetchMock);

    const received: string[] = [];
    const connection = new CopilotStreamConnection("http://x/stream", {
      onEvent: (e) => received.push(`${e.event}:${(e.data as { delta?: string }).delta}`),
    });
    await connection.connect();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://x/stream",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
    expect(received).toEqual(["message_delta:Hi", "message_delta:Hi"]);
    expect(connection.isClosed).toBe(true);
  });

  it("sends Last-Event-ID when resuming", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([record(5, "message_delta", data())]));
    vi.stubGlobal("fetch", fetchMock);

    const connection = new CopilotStreamConnection("http://x/stream", { onEvent: () => {} }, { lastEventId: 4 });
    await connection.connect();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://x/stream",
      expect.objectContaining({ headers: expect.objectContaining({ "Last-Event-ID": "4" }) })
    );
  });

  it("reconnects with backoff after a dropped stream and resumes from the last id", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      // First attempt: one event then the connection drops.
      .mockResolvedValueOnce(okResponse([record(1, "message_delta", data({ delta: "a" }))]))
      // Second attempt succeeds.
      .mockResolvedValueOnce(okResponse([record(2, "message_delta", data({ delta: "b" }))]));
    vi.stubGlobal("fetch", fetchMock);

    // First attempt rejects mid-read to simulate a drop.
    fetchMock.mockReset();
    let firstRead = true;
    const droppingBody = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (firstRead) {
          firstRead = false;
          controller.enqueue(encoder.encode(record(1, "message_delta", data({ delta: "a" }))));
        } else {
          controller.error(new Error("boom"));
        }
      },
    });
    fetchMock.mockResolvedValueOnce(new Response(droppingBody, { status: 200 }));
    fetchMock.mockResolvedValueOnce(okResponse([record(2, "message_delta", data({ delta: "b" }))]));

    const events: string[] = [];
    const connection = new CopilotStreamConnection(
      "http://x/stream",
      { onEvent: (e) => events.push(String((e.data as { delta?: string }).delta)), onError: () => {} },
      { baseReconnectDelay: 1000, maxReconnectAttempts: 3 }
    );

    const first = connection.connect();
    await vi.runAllTimersAsync();
    await first;
    await vi.runAllTimersAsync();

    expect(events).toEqual(["a", "b"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // The second call resumes from event id 1.
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://x/stream",
      expect.objectContaining({ headers: expect.objectContaining({ "Last-Event-ID": "1" }) })
    );
  });

  it("does not reconnect on a 4xx response", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(new Response("forbidden", { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    const onError = vi.fn();
    const onClose = vi.fn();
    const connection = new CopilotStreamConnection(
      "http://x/stream",
      { onEvent: () => {}, onError, onClose },
      { maxReconnectAttempts: 3 }
    );

    await connection.connect();
    await vi.runAllTimersAsync();

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
    expect(connection.isClosed).toBe(true);
  });

  it("gives up after the max reconnect attempts", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const onClose = vi.fn();
    const connection = new CopilotStreamConnection(
      "http://x/stream",
      { onEvent: () => {}, onError: () => {}, onClose },
      { baseReconnectDelay: 100, maxReconnectAttempts: 2 }
    );

    const first = connection.connect();
    await vi.runAllTimersAsync();
    await first;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(connection.isClosed).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });

  it("close() aborts the fetch and stops reconnecting", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const connection = new CopilotStreamConnection(
      "http://x/stream",
      { onEvent: () => {}, onError: () => {}, onClose: () => {} },
      { baseReconnectDelay: 100, maxReconnectAttempts: 5 }
    );

    const first = connection.connect();
    connection.close();
    await vi.runAllTimersAsync();
    await first;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(connection.isClosed).toBe(true);
  });
});
