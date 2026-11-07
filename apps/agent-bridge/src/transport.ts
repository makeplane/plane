/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Stream } from "@agentclientprotocol/sdk";
import { createWebSocketStream, type WebSocketConstructor } from "@agentclientprotocol/sdk/experimental/ws-client";
import { clampPermissionLevel, signSpawnTicket } from "@plane/agent-runner-protocol";
import { WebSocket, type ClientOptions } from "ws";

import type { AgentSessionGrant } from "./plane-api.ts";

/** One open ACP connection to an agent, owned by one browser connection. */
export interface AgentChannel {
  readonly stream: Stream;
  /** Close the connection; the agent behind it is stopped. Idempotent. */
  close(): void;
}

/**
 * How the bridge reaches agents. Today every agent runs in the agent runner; a direct remote ACP
 * agent (the user's own `/acp` endpoint) slots in as another implementation.
 */
export interface AgentTransport {
  open(grant: AgentSessionGrant, signal: AbortSignal): Promise<AgentChannel>;
}

export interface RunnerTransportOptions {
  /** Runner ACP endpoint, e.g. `ws://agent-runner:3410/acp`. */
  readonly url: string;
  /** Signs spawn tickets. */
  readonly secret: string;
  /** Largest frame accepted from the runner. */
  readonly maxMessageBytes: number;
  readonly connectTimeoutMs?: number;
}

/**
 * The agent runner, over ACP-on-WebSocket (the SDK's experimental `createWebSocketStream`). The
 * upgrade carries a single-use spawn ticket that tells the runner which adapter to start, with
 * which env, for which user and workspace. The socket is open before `open` resolves, so a runner
 * that is down or refuses the ticket fails the browser connection up front.
 */
export class RunnerTransport implements AgentTransport {
  readonly #options: RunnerTransportOptions;

  constructor(options: RunnerTransportOptions) {
    this.#options = options;
  }

  async open(grant: AgentSessionGrant, signal: AbortSignal): Promise<AgentChannel> {
    const { agent } = grant;
    const ticket = signSpawnTicket(
      {
        adapter: agent.adapter,
        env: agent.env,
        userId: grant.user.id,
        workspaceId: grant.workspace.id,
        initialMode: clampPermissionLevel(agent.defaultPermissionLevel, agent.maxPermissionLevel),
        sessionRef: grant.tokenId,
      },
      this.#options.secret
    );

    const maxPayload = this.#options.maxMessageBytes;
    const handshakeTimeout = this.#options.connectTimeoutMs ?? 10_000;
    let socket: WebSocket | undefined;
    // createWebSocketStream builds the socket itself; this constructor hands it back so we can
    // wait for the upgrade, and applies the frame limit. (`new` on a function that returns an
    // object yields that object.)
    const RunnerSocket = function (
      address: string,
      protocols?: string | string[],
      options?: { headers?: Record<string, string> }
    ) {
      const clientOptions: ClientOptions = { ...options, maxPayload, handshakeTimeout, perMessageDeflate: false };
      socket = new WebSocket(address, protocols, clientOptions);
      return socket;
    } as unknown as WebSocketConstructor;

    const stream = createWebSocketStream(this.#options.url, {
      WebSocket: RunnerSocket,
      headers: { Authorization: `Bearer ${ticket}` },
      cookies: "omit",
    });
    const opened = socket as WebSocket | undefined;
    if (!opened) throw new Error("runner socket was not created");

    const close = () => {
      if (opened.readyState === WebSocket.CLOSED || opened.readyState === WebSocket.CLOSING) return;
      try {
        opened.close(1000, "client closed");
      } catch {
        opened.terminate();
      }
    };

    await new Promise<void>((resolve, reject) => {
      if (opened.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }
      const cleanup = () => {
        opened.off("open", onOpen);
        opened.off("error", onError);
        opened.off("close", onClose);
        signal.removeEventListener("abort", onAbort);
      };
      const onOpen = () => {
        cleanup();
        resolve();
      };
      const onError = (error: Error) => {
        cleanup();
        reject(new Error(`agent runner refused the connection: ${error.message}`));
      };
      const onClose = (code: number) => {
        cleanup();
        reject(new Error(`agent runner closed the connection (${code})`));
      };
      const onAbort = () => {
        cleanup();
        opened.terminate();
        reject(new Error("aborted"));
      };
      opened.on("open", onOpen);
      opened.on("error", onError);
      opened.on("close", onClose);
      signal.addEventListener("abort", onAbort, { once: true });
    });

    return { stream, close };
  }
}
