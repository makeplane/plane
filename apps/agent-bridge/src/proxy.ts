/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  RequestError,
  type AgentConnectionLifecycle,
  type AgentConnector,
  type AnyMessage,
  type AnyRequest,
  type AnyResponse,
  type SessionUpdate,
  type Stream,
} from "@agentclientprotocol/sdk";

import type { Logger } from "./logger.ts";
import {
  AGENT_NOTIFICATIONS,
  AGENT_REQUESTS,
  CLIENT_NOTIFICATIONS,
  CLIENT_REQUESTS,
  SESSION_SETUP_METHODS,
  type SessionPolicy,
} from "./policy.ts";
import type { AgentChannel } from "./transport.ts";

/** Application close codes the browser sees (RFC 6455 reserves 4000-4999 for applications). */
export const CloseCode = {
  normal: 1000,
  goingAway: 1001,
  internalError: 1011,
  badRequest: 4400,
  unauthenticated: 4401,
  forbidden: 4403,
  agentNotFound: 4404,
  idleTimeout: 4408,
  sessionExpired: 4410,
  tooManyConnections: 4429,
  agentUnavailable: 4502,
} as const;

const DEFAULT_INITIALIZE_TIMEOUT_MS = 30_000;

type Kind = "request" | "notification" | "response" | "invalid";

function kindOf(message: AnyMessage): Kind {
  const hasMethod = "method" in message && typeof message.method === "string";
  const hasId = "id" in message && message.id !== undefined;
  if (hasMethod) return hasId ? "request" : "notification";
  return hasId ? "response" : "invalid";
}

function idKey(id: unknown): string | undefined {
  if (typeof id === "string") return `s:${id}`;
  if (typeof id === "number" && Number.isFinite(id)) return `n:${id}`;
  return undefined;
}

function errorResponse(id: AnyRequest["id"], error: RequestError): AnyResponse {
  return { jsonrpc: "2.0", id, error: error.toErrorResponse() } as AnyResponse;
}

interface PendingClientRequest {
  readonly method: string;
  readonly sessionId?: string | undefined;
}

export interface PolicyProxyOptions {
  readonly policy: SessionPolicy;
  readonly upstream: AgentChannel;
  readonly log: Logger;
  readonly idleTimeoutMs: number;
  /** A browser that has not sent `initialize` by then is closed (an agent is already running for it). */
  readonly initializeTimeoutMs?: number;
  /** When the agent-session token expires; the connection closes then. */
  readonly expiresAt?: Date | undefined;
  /** Close the browser socket with an application code. */
  readonly closeClient: (code: number, reason: string) => void;
}

/**
 * The bridge's ACP policy proxy for one browser connection, plugged into the SDK's `AcpServer` as
 * the "agent". It relays JSON-RPC frames between the browser and the agent without translating
 * them, except for the rewrites and refusals `SessionPolicy` decides.
 */
export class PolicyProxy implements AgentConnector {
  readonly #options: PolicyProxyOptions;
  readonly #clientPending = new Map<string, PendingClientRequest>();
  readonly #agentPending = new Set<string>();
  #client: WritableStreamDefaultWriter<AnyMessage> | undefined;
  #agent: WritableStreamDefaultWriter<AnyMessage> | undefined;
  #readers: ReadableStreamDefaultReader<AnyMessage>[] = [];
  #idleTimer: ReturnType<typeof setTimeout> | undefined;
  #expiryTimer: ReturnType<typeof setTimeout> | undefined;
  #initializeTimer: ReturnType<typeof setTimeout> | undefined;
  #closed = false;
  #closeReason = "";
  readonly #done: Promise<void>;
  #resolveDone!: () => void;

  constructor(options: PolicyProxyOptions) {
    this.#options = options;
    this.#done = new Promise((resolve) => {
      this.#resolveDone = resolve;
    });
  }

  /** Resolves once the proxy has shut down (both sides closed). */
  get closed(): Promise<void> {
    return this.#done;
  }

  get closeReason(): string {
    return this.#closeReason;
  }

  connect(stream: Stream): AgentConnectionLifecycle {
    this.#client = stream.writable.getWriter();
    this.#agent = this.#options.upstream.stream.writable.getWriter();
    const fromClient = stream.readable.getReader();
    const fromAgent = this.#options.upstream.stream.readable.getReader();
    this.#readers = [fromClient, fromAgent];

    this.#touch();
    this.#initializeTimer = setTimeout(() => {
      this.#closeClient(CloseCode.idleTimeout, "No initialize");
      this.close("no initialize");
    }, this.#options.initializeTimeoutMs ?? DEFAULT_INITIALIZE_TIMEOUT_MS);
    this.#initializeTimer.unref?.();
    const { expiresAt } = this.#options;
    if (expiresAt) {
      const ms = Math.min(Math.max(0, expiresAt.getTime() - Date.now()), 2 ** 31 - 1);
      this.#expiryTimer = setTimeout(() => this.#closeClient(CloseCode.sessionExpired, "Agent session expired"), ms);
      this.#expiryTimer.unref?.();
    }

    void this.#run(fromClient, (message) => this.#fromClient(message), "client");
    void this.#run(fromAgent, (message) => this.#fromAgent(message), "agent");
    return { closed: this.#done };
  }

  /** Stop relaying and close both sides. Idempotent. */
  close(reason: string): void {
    if (this.#closed) return;
    this.#closed = true;
    this.#closeReason = reason;
    clearTimeout(this.#idleTimer);
    clearTimeout(this.#expiryTimer);
    clearTimeout(this.#initializeTimer);
    for (const reader of this.#readers) reader.cancel().catch(() => undefined);
    this.#options.upstream.close();
    this.#client?.close().catch(() => undefined);
    this.#resolveDone();
  }

  /** Relay one direction until it ends; the end of either side ends the connection. */
  async #run(
    reader: ReadableStreamDefaultReader<AnyMessage>,
    handle: (message: AnyMessage) => Promise<void>,
    side: "client" | "agent"
  ): Promise<void> {
    let reason = `${side} disconnected`;
    try {
      await this.#pump(reader, handle);
    } catch (error) {
      reason = `${side} stream failed: ${(error as Error)?.message ?? String(error)}`;
    }
    // The browser socket only needs an explicit close when the agent side ended first.
    if (side === "agent" && !this.#closed) this.#closeClient(CloseCode.agentUnavailable, "Agent disconnected");
    this.close(reason);
  }

  async #pump(reader: ReadableStreamDefaultReader<AnyMessage>, handle: (message: AnyMessage) => Promise<void>) {
    for (;;) {
      // oxlint-disable-next-line no-await-in-loop -- frames are relayed strictly in order
      const { done, value } = await reader.read();
      if (done || this.#closed) return;
      this.#touch();
      // oxlint-disable-next-line no-await-in-loop -- frames are relayed strictly in order
      await handle(value);
    }
  }

  #touch(): void {
    if (this.#closed) return;
    clearTimeout(this.#idleTimer);
    this.#idleTimer = setTimeout(() => this.#onIdle(), this.#options.idleTimeoutMs);
    this.#idleTimer.unref?.();
  }

  #onIdle(): void {
    // A long turn can be quiet; only a connection with nothing in flight is idle.
    if (this.#clientPending.size > 0 || this.#agentPending.size > 0) {
      this.#touch();
      return;
    }
    this.#closeClient(CloseCode.idleTimeout, "Idle timeout");
    this.close("idle timeout");
  }

  #closeClient(code: number, reason: string): void {
    try {
      this.#options.closeClient(code, reason);
    } catch (error) {
      this.#options.log.warn("agent-bridge: failed to close client socket", { error: (error as Error).message });
    }
  }

  async #toClient(message: AnyMessage): Promise<void> {
    if (this.#closed || !this.#client) return;
    await this.#client.write(message).catch(() => this.close("client write failed"));
  }

  async #toAgent(message: AnyMessage): Promise<void> {
    if (this.#closed || !this.#agent) return;
    await this.#agent.write(message).catch(() => this.close("agent write failed"));
  }

  async #fromClient(message: AnyMessage): Promise<void> {
    const { log } = this.#options;
    const policy = this.#options.policy;
    switch (kindOf(message)) {
      case "request": {
        const request = message as AnyRequest;
        if (!CLIENT_REQUESTS.has(request.method)) {
          log.info("agent-bridge: refused client request", { method: request.method });
          await this.#toClient(errorResponse(request.id, RequestError.methodNotFound(request.method)));
          return;
        }
        let params: unknown = request.params;
        try {
          if (request.method === "initialize") {
            clearTimeout(this.#initializeTimer);
            params = policy.rewriteInitialize(params);
          } else if (SESSION_SETUP_METHODS.has(request.method)) params = policy.rewriteSessionSetup(params);
          else if (request.method === "session/list") params = policy.rewriteSessionList(params);
          else if (request.method === "session/set_mode") policy.checkSetMode(params);
        } catch (error) {
          if (!(error instanceof RequestError)) throw error;
          log.info("agent-bridge: rejected client request", { method: request.method, reason: error.message });
          await this.#toClient(errorResponse(request.id, error));
          return;
        }
        const key = idKey(request.id);
        if (key) {
          const sessionId =
            typeof params === "object" && params !== null && "sessionId" in params
              ? String((params as { sessionId: unknown }).sessionId)
              : undefined;
          this.#clientPending.set(key, { method: request.method, sessionId });
        }
        await this.#toAgent({ ...request, params } as AnyRequest);
        return;
      }
      case "notification": {
        const method = (message as { method: string }).method;
        if (!CLIENT_NOTIFICATIONS.has(method)) {
          log.info("agent-bridge: dropped client notification", { method });
          return;
        }
        await this.#toAgent(message);
        return;
      }
      case "response": {
        const key = idKey((message as AnyResponse).id);
        if (!key || !this.#agentPending.delete(key)) {
          log.info("agent-bridge: dropped unsolicited client response");
          return;
        }
        await this.#toAgent(message);
        return;
      }
      default:
        log.info("agent-bridge: dropped malformed client frame");
    }
  }

  async #fromAgent(message: AnyMessage): Promise<void> {
    const { log } = this.#options;
    switch (kindOf(message)) {
      case "request": {
        const request = message as AnyRequest;
        if (!AGENT_REQUESTS.has(request.method)) {
          log.info("agent-bridge: refused agent request", { method: request.method });
          await this.#toAgent(errorResponse(request.id, RequestError.methodNotFound(request.method)));
          return;
        }
        const key = idKey(request.id);
        if (key) this.#agentPending.add(key);
        await this.#toClient(message);
        return;
      }
      case "notification": {
        const method = (message as { method: string }).method;
        if (!AGENT_NOTIFICATIONS.has(method)) {
          log.info("agent-bridge: dropped agent notification", { method });
          return;
        }
        await this.#toClient(message);
        return;
      }
      case "response": {
        await this.#relayAgentResponse(message as AnyResponse);
        return;
      }
      default:
        log.info("agent-bridge: dropped malformed agent frame");
    }
  }

  async #relayAgentResponse(response: AnyResponse): Promise<void> {
    const policy = this.#options.policy;
    const key = idKey(response.id);
    const pending = key ? this.#clientPending.get(key) : undefined;
    if (!key || !pending) {
      this.#options.log.info("agent-bridge: dropped unsolicited agent response");
      return;
    }
    this.#clientPending.delete(key);
    const ok = "result" in response;
    if (!ok) {
      await this.#toClient(response);
      return;
    }
    if (pending.method === "initialize") {
      policy.observeInitializeResult(response.result);
      await this.#toClient(response);
      return;
    }
    if (SESSION_SETUP_METHODS.has(pending.method)) {
      const result = policy.filterSessionResult(response.result);
      await this.#toClient({ ...response, result } as AnyResponse);
      const sessionId =
        pending.method === "session/new"
          ? typeof result === "object" && result !== null && "sessionId" in result
            ? String((result as { sessionId: unknown }).sessionId)
            : undefined
          : pending.sessionId;
      const notice = policy.mcpNotice();
      if (notice && sessionId) await this.#emit(sessionId, notice);
      return;
    }
    await this.#toClient(response);
  }

  async #emit(sessionId: string, update: SessionUpdate): Promise<void> {
    await this.#toClient({ jsonrpc: "2.0", method: "session/update", params: { sessionId, update } });
  }
}
