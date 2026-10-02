/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCopilotStreamEvent } from "@plane/types";

// The four event names the copilot stream can emit.
const EVENT_NAMES = new Set(["message_delta", "tool_call_start", "tool_call_update", "tool_call_end"]);

export type TParsedSSEEvent = {
  // The SSE `id`, used as the Last-Event-ID resume cursor.
  id: number | null;
  event: TCopilotStreamEvent["event"];
  // The parsed JSON data payload, including the sequence.
  data: Record<string, unknown>;
};

/**
 * Incrementally parse an SSE byte stream into events.
 * Feed it text chunks as they arrive; it returns every complete event in the chunk.
 */
export class SSEParser {
  private buffer = "";

  /** Append a decoded text chunk and return the events completed by it. */
  push(chunk: string): TParsedSSEEvent[] {
    this.buffer += chunk;
    const events: TParsedSSEEvent[] = [];
    // SSE records are separated by a blank line.
    let boundary = this.buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const raw = this.buffer.slice(0, boundary);
      this.buffer = this.buffer.slice(boundary + 2);
      const parsed = SSEParser.parseRecord(raw);
      if (parsed) events.push(parsed);
      boundary = this.buffer.indexOf("\n\n");
    }
    return events;
  }

  /** Parse one SSE record (the text between blank lines). */
  private static parseRecord(raw: string): TParsedSSEEvent | null {
    // Comment-only records (lines starting with ":") are keep-alives; skip them.
    if (raw.startsWith(":")) return null;

    let id: number | null = null;
    let event: TParsedSSEEvent["event"] = "message_delta";
    const dataLines: string[] = [];

    for (const line of raw.split("\n")) {
      if (line === "" || line.startsWith(":")) continue;
      const colon = line.indexOf(":");
      const fieldName = colon === -1 ? line : line.slice(0, colon);
      let value = colon === -1 ? "" : line.slice(colon + 1);
      if (value.startsWith(" ")) value = value.slice(1);

      if (fieldName === "id") {
        const parsed = parseInt(value, 10);
        id = Number.isNaN(parsed) ? null : parsed;
      } else if (fieldName === "event") {
        if (EVENT_NAMES.has(value)) event = value as TParsedSSEEvent["event"];
      } else if (fieldName === "data") {
        dataLines.push(value);
      }
    }

    if (dataLines.length === 0) return null;

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(dataLines.join("\n"));
    } catch {
      return null;
    }
    return { id, event, data };
  }
}

export type TCopilotStreamHandlers = {
  onEvent: (event: TCopilotStreamEvent) => void;
  onError?: (error: { status?: number; message: string }) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

export type TCopilotStreamOptions = {
  // Resume cursor; sent as the Last-Event-ID header.
  lastEventId?: number;
  // Base backoff in ms before the first reconnect.
  baseReconnectDelay?: number;
  // Maximum backoff in ms.
  maxReconnectDelay?: number;
  // Maximum number of reconnect attempts before giving up. 0 disables reconnects.
  maxReconnectAttempts?: number;
};

const DEFAULTS = {
  baseReconnectDelay: 1000,
  maxReconnectDelay: 15000,
  maxReconnectAttempts: 5,
};

/**
 * Open and consume the copilot SSE stream over fetch, with cookie auth, typed
 * events, and automatic reconnect that resumes via Last-Event-ID.
 */
export class CopilotStreamConnection {
  private controller: AbortController | null = null;
  private parser = new SSEParser();
  private lastEventId: number | undefined;
  private reconnectAttempts = 0;
  private closed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly url: string,
    private readonly handlers: TCopilotStreamHandlers,
    private readonly options: TCopilotStreamOptions = {}
  ) {
    this.lastEventId = options.lastEventId;
  }

  get isClosed(): boolean {
    return this.closed;
  }

  /** Open (or re-open) the stream. */
  async connect(): Promise<void> {
    if (this.closed) return;
    this.controller = new AbortController();

    const headers: Record<string, string> = { Accept: "text/event-stream" };
    if (this.lastEventId !== undefined) headers["Last-Event-ID"] = String(this.lastEventId);

    let response: Response;
    try {
      response = await fetch(this.url, {
        method: "GET",
        headers,
        credentials: "include",
        signal: this.controller.signal,
        cache: "no-store",
      });
    } catch (error) {
      if (this.isAbortError(error)) return;
      this.handleConnectionError({ message: "Network error" });
      return;
    }

    if (!response.ok) {
      this.handleConnectionError({ status: response.status, message: `HTTP ${response.status}` });
      return;
    }

    if (!response.body) {
      this.handleConnectionError({ message: "The response has no body" });
      return;
    }

    this.handlers.onOpen?.();
    this.reconnectAttempts = 0;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    try {
      // The stream is read sequentially; each chunk depends on the previous read.
      for (;;) {
        // oxlint-disable-next-line no-await-in-loop
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const event of this.parser.push(text)) {
          if (event.id !== null) this.lastEventId = event.id;
          this.handlers.onEvent({ event: event.event, data: event.data } as TCopilotStreamEvent);
        }
      }
      // The server closed the stream cleanly.
      this.handlers.onClose?.();
      this.closed = true;
    } catch (error) {
      if (this.isAbortError(error)) return;
      this.handleConnectionError({ message: "Stream read error" });
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // ignore
      }
    }
  }

  /** Permanently close the stream and stop any pending reconnect. */
  close(): void {
    this.closed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.controller?.abort();
    this.controller = null;
    this.handlers.onClose?.();
  }

  private handleConnectionError(error: { status?: number; message: string }): void {
    this.handlers.onError?.(error);
    // Do not retry on client or auth errors.
    if (error.status !== undefined && error.status >= 400 && error.status < 500) {
      this.closed = true;
      this.handlers.onClose?.();
      return;
    }
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.closed) return;
    const { maxReconnectAttempts } = { ...DEFAULTS, ...this.options };
    if (this.reconnectAttempts >= maxReconnectAttempts) {
      this.closed = true;
      this.handlers.onClose?.();
      return;
    }
    this.reconnectAttempts += 1;
    const delay = this.reconnectDelay();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  private reconnectDelay(): number {
    const { baseReconnectDelay, maxReconnectDelay } = { ...DEFAULTS, ...this.options };
    // Exponential backoff: base, 2*base, 4*base, ... capped at max.
    const delay = baseReconnectDelay * 2 ** (this.reconnectAttempts - 1);
    return Math.min(delay, maxReconnectDelay);
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === "AbortError";
  }
}
