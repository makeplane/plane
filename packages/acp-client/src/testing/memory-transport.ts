/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { AgentApp, AnyMessage } from "@agentclientprotocol/sdk";

import type { CloseInfo } from "../close-codes.ts";
import type { AgentTransport } from "../transport.ts";

export interface MemoryTransport extends AgentTransport {
  /** Close from the "server" side with a close code, like the bridge does. */
  closeWith(code: number, reason?: string): void;
  readonly sent: AnyMessage[];
}

/**
 * An in-memory transport wired to an SDK `agent()` app. Messages are JSON round-tripped like
 * on the wire, and `closeWith(code)` ends both directions and reports the close code.
 */
export function memoryTransport(agentApp: AgentApp): MemoryTransport {
  let toClient!: ReadableStreamDefaultController<AnyMessage>;
  let toAgent!: ReadableStreamDefaultController<AnyMessage>;
  let isClosed = false;
  let resolveClosed!: (info: CloseInfo) => void;
  const closed = new Promise<CloseInfo>((resolve) => {
    resolveClosed = resolve;
  });
  const sent: AnyMessage[] = [];
  const wire = (message: AnyMessage) => JSON.parse(JSON.stringify(message)) as AnyMessage;

  const clientReadable = new ReadableStream<AnyMessage>({
    start(controller) {
      toClient = controller;
    },
  });
  const agentReadable = new ReadableStream<AnyMessage>({
    start(controller) {
      toAgent = controller;
    },
  });

  agentApp.connect({
    readable: agentReadable,
    writable: new WritableStream<AnyMessage>({
      write(message) {
        if (!isClosed) toClient.enqueue(wire(message));
      },
    }),
  });

  const closeWith = (code: number, reason = "") => {
    if (isClosed) return;
    isClosed = true;
    for (const controller of [toClient, toAgent]) {
      try {
        controller.close();
      } catch {
        // Already closed or cancelled by the connection.
      }
    }
    resolveClosed({ code, reason, wasClean: true });
  };

  return {
    sent,
    closed,
    closeWith,
    close: (code = 1000, reason = "") => closeWith(code, reason),
    stream: {
      readable: clientReadable,
      writable: new WritableStream<AnyMessage>({
        write(message) {
          if (isClosed) throw new Error("closed");
          sent.push(wire(message));
          toAgent.enqueue(wire(message));
        },
      }),
    },
  };
}
