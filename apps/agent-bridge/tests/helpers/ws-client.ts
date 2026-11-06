/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- polling */
import { WebSocket } from "ws";

export type Frame = Record<string, unknown> & {
  id?: unknown;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: { code: number; message: string; data?: unknown };
};

/** A raw JSON-RPC-over-WebSocket client, for frames an SDK client would never send. */
export class RawClient {
  readonly frames: Frame[] = [];
  closeCode: number | undefined;
  closeReason = "";
  unexpectedStatus: number | undefined;
  readonly opened: Promise<void>;
  readonly socket: WebSocket;
  #nextId = 1000;

  constructor(url: string, headers: Record<string, string>) {
    this.socket = new WebSocket(url, { headers });
    this.socket.on("message", (data) => this.frames.push(JSON.parse(String(data)) as Frame));
    this.socket.on("close", (code, reason) => {
      this.closeCode = code;
      this.closeReason = String(reason);
    });
    this.socket.on("unexpected-response", (_req, res) => {
      this.unexpectedStatus = res.statusCode;
      this.closeCode = -1;
      this.socket.terminate();
    });
    this.socket.on("error", () => undefined);
    this.opened = new Promise((resolve, reject) => {
      this.socket.once("open", () => resolve());
      this.socket.once("close", () => reject(new Error("closed before open")));
    });
    this.opened.catch(() => undefined);
  }

  send(frame: Record<string, unknown>): void {
    this.socket.send(JSON.stringify({ jsonrpc: "2.0", ...frame }));
  }

  /** Send a request and wait for its response. */
  async request(method: string, params: Record<string, unknown> = {}): Promise<Frame> {
    const id = this.#nextId++;
    this.send({ id, method, params });
    return this.waitFor((frame) => frame.id === id && !("method" in frame));
  }

  async waitFor(predicate: (frame: Frame) => boolean, timeoutMs = 5_000): Promise<Frame> {
    return waitUntil(() => this.frames.find(predicate), timeoutMs);
  }

  async closed(timeoutMs = 5_000): Promise<number> {
    return waitUntil(() => this.closeCode, timeoutMs);
  }
}

export async function waitUntil<T>(probe: () => T | undefined | false, timeoutMs = 5_000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = probe();
    if (value !== undefined && value !== false) return value;
    if (Date.now() > deadline) throw new Error("timed out");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
