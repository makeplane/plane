/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Writable } from "node:stream";

import { ndJsonStream, type AnyMessage, type Stream } from "@agentclientprotocol/sdk";

import { deferred } from "./abort.ts";
import { createAgent, type AgentAdapter, type AgentRuntime, type CreateAgentOptions } from "./agent.ts";

/** How long stdin EOF waits for in-flight requests before the connection closes anyway. */
const DEFAULT_DRAIN_MS = 30_000;
/** Largest inbound frame; prompts may embed resources, but nothing legitimate comes close. */
export const DEFAULT_MAX_MESSAGE_BYTES = 8 * 1024 * 1024;
export const MAX_MESSAGE_BYTES_ENV = "PLANE_ACP_MAX_MESSAGE_BYTES";
/** How long SIGINT/SIGTERM may take before the process exits regardless. */
const SIGNAL_DEADLINE_MS = 1_500;

export interface StdioOptions extends CreateAgentOptions {
  readonly drainMs?: number;
  readonly maxMessageBytes?: number;
}

export interface MessageStreamOptions {
  readonly drainMs?: number;
}

/**
 * Wrap an ACP message stream with the two transport guarantees the adapters rely on:
 *
 * - Messages queued behind `initialize` are held until its response has been written, so a client
 *   that pipes `initialize`, `session/new` and `session/prompt` in one write behaves like one that
 *   waits (the SDK otherwise rejects requests that arrive before `initialize` is answered).
 * - End of input does not close the connection until in-flight requests are answered and their
 *   responses written ("EOF drains"), bounded by `drainMs`.
 *
 * Every outbound frame goes through the one writer here, which awaits each write, so producers that
 * await `notify` are backpressured by stdout.
 */
export function sequencedStream(stream: Stream, runtime: AgentRuntime, options: MessageStreamOptions = {}): Stream {
  let held: { id: unknown; release: () => void; released: Promise<void> } | undefined;
  let pendingWrites = 0;
  const drainMs = options.drainMs ?? DEFAULT_DRAIN_MS;

  const settled = async () => {
    const deadline = Date.now() + drainMs;
    let quietTicks = 0;
    while (quietTicks < 3 && Date.now() < deadline) {
      // oxlint-disable-next-line no-await-in-loop -- polling until in-flight requests settle
      await new Promise((resolve) => setImmediate(resolve));
      if (runtime.inflight() === 0 && pendingWrites === 0 && !held) {
        quietTicks += 1;
      } else {
        quietTicks = 0;
        if (runtime.inflight() > 0) {
          // oxlint-disable-next-line no-await-in-loop -- polling until in-flight requests settle
          await Promise.race([
            runtime.idle(),
            new Promise((resolve) => setTimeout(resolve, Math.max(0, deadline - Date.now()))),
          ]);
        }
      }
    }
  };

  const readable = stream.readable.pipeThrough(
    new TransformStream<AnyMessage, AnyMessage>({
      async transform(message, controller) {
        if (held) await held.released;
        controller.enqueue(message);
        // Only a well-formed request gets an answer carrying its id; anything else (e.g. `id: true`)
        // is rejected with `id: null` and must not hold the stream.
        const id = "id" in message ? message.id : undefined;
        if (
          "method" in message &&
          message.method === "initialize" &&
          (typeof id === "string" || typeof id === "number")
        ) {
          const gate = deferred<void>();
          held = { id, release: () => gate.resolve(), released: gate.promise };
        }
      },
      async flush() {
        await settled();
      },
    })
  );

  const inner = stream.writable.getWriter();
  const writable = new WritableStream<AnyMessage>({
    async write(message) {
      pendingWrites += 1;
      try {
        await inner.write(message);
      } finally {
        pendingWrites -= 1;
      }
      if (held && !("method" in message) && "id" in message && message.id === held.id) {
        const { release } = held;
        held = undefined;
        release();
      }
    },
    async close() {
      await inner.close();
    },
  });

  return { readable, writable };
}

/** A transport-level failure that ends the connection: answered with one `-32600` frame, exit 1. */
export interface FatalFrame {
  readonly message: string;
}

/**
 * stdin as a byte stream of validated lines. Like the employai_v2 conformance agent, a frame that
 * is not valid UTF-8 or is larger than the limit is fatal: earlier frames are still served, then
 * the connection drains and closes. (The SDK's own decoder would replace bad bytes and keep going,
 * and its size limit closes the connection without a response.)
 */
export function guardedLines(
  input: NodeJS.ReadableStream,
  maxMessageBytes: number,
  onFatal: (fatal: FatalFrame) => void
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let pending: Buffer[] = [];
  let pendingBytes = 0;
  let stopped = false;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const stop = (message: string) => {
        if (stopped) return;
        stopped = true;
        onFatal({ message });
        controller.close();
      };
      const emitLine = (line: Buffer): boolean => {
        try {
          decoder.decode(line);
        } catch {
          stop("frame is not valid UTF-8");
          return false;
        }
        controller.enqueue(new Uint8Array(Buffer.concat([line, Buffer.from("\n")])));
        return true;
      };
      input.on("data", (data: Buffer | string) => {
        if (stopped) return;
        let chunk = typeof data === "string" ? Buffer.from(data) : data;
        for (let newline = chunk.indexOf(0x0a); newline >= 0; newline = chunk.indexOf(0x0a)) {
          if (pendingBytes + newline > maxMessageBytes) return stop(`frame exceeds the ${maxMessageBytes} byte limit`);
          const line = Buffer.concat([...pending, chunk.subarray(0, newline)]);
          pending = [];
          pendingBytes = 0;
          if (!emitLine(line)) return;
          chunk = chunk.subarray(newline + 1);
        }
        pendingBytes += chunk.byteLength;
        if (pendingBytes > maxMessageBytes) return stop(`frame exceeds the ${maxMessageBytes} byte limit`);
        if (chunk.byteLength) pending.push(chunk);
      });
      input.on("end", () => {
        if (stopped) return;
        if (pendingBytes && !emitLine(Buffer.concat(pending))) return;
        stopped = true;
        controller.close();
      });
      input.on("error", (error) => controller.error(error));
    },
  });
}

/**
 * Serve an adapter over stdio as newline-delimited JSON-RPC. stdout carries protocol frames only;
 * `console.log`/`info`/`debug` are redirected to stderr so a stray log can never corrupt it.
 */
export async function runStdioAgent(adapter: AgentAdapter, options: StdioOptions = {}): Promise<void> {
  console.log = console.error;
  console.info = console.error;
  console.debug = console.error;

  const runtime = createAgent(adapter, options);
  const configuredLimit = Number(process.env[MAX_MESSAGE_BYTES_ENV]);
  const maxMessageBytes =
    options.maxMessageBytes ??
    (Number.isSafeInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : DEFAULT_MAX_MESSAGE_BYTES);
  let fatal: FatalFrame | undefined;
  const input = guardedLines(process.stdin, maxMessageBytes, (failure) => {
    fatal = failure;
  });
  const base = ndJsonStream(Writable.toWeb(process.stdout) as WritableStream<Uint8Array>, input, { maxMessageBytes });
  const connection = runtime.app.connect(sequencedStream(base, runtime, options));

  const onSignal = () => {
    setTimeout(() => process.exit(0), SIGNAL_DEADLINE_MS).unref();
    connection.close();
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);

  await connection.closed;
  await runtime.shutdown();
  // The connection is closed, so this is the only writer left.
  const failure = fatal as FatalFrame | undefined;
  const last = failure
    ? `${JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32600, message: `Invalid request: ${failure.message}` } })}\n`
    : "";
  await new Promise<void>((resolve) => process.stdout.write(last, () => resolve()));
  // Provider SDKs (MCP clients, child processes) can hold the event loop open; the protocol is done.
  process.exit(failure ? 1 : 0);
}
