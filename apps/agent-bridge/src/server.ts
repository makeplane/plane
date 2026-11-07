/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createServer, type IncomingMessage, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Duplex } from "node:stream";

import { AcpServer } from "@agentclientprotocol/sdk/experimental/server";
import express, { type Express } from "express";
import { WebSocketServer, type WebSocket } from "ws";

import type { BridgeConfig } from "./config.ts";
import { connectionsRouter } from "./connections.ts";
import { createLogger, withMeta, type Logger } from "./logger.ts";
import { originAllowed } from "./origin.ts";
import { createPlaneApi, PlaneApiError, type AgentSessionGrant, type PlaneApi } from "./plane-api.ts";
import { SessionPolicy } from "./policy.ts";
import { CloseCode, PolicyProxy } from "./proxy.ts";
import { RunnerLoginClient, type LoginRunner } from "./runner-login.ts";
import { RunnerTransport, type AgentChannel, type AgentTransport } from "./transport.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[A-Za-z0-9_-]{1,64}$/;
/** How long shutdown waits for open connections to revoke their tokens. */
const SHUTDOWN_DEADLINE_MS = 10_000;

export interface AgentBridgeOptions {
  readonly config: BridgeConfig;
  readonly api?: PlaneApi;
  readonly transport?: AgentTransport;
  /** The runner's sign-in endpoints; defaults to HTTP at `config.runnerHttpUrl`. */
  readonly loginRunner?: LoginRunner;
  readonly log?: Logger;
  /** How long a new connection has to send `initialize` (default 30 s). */
  readonly initializeTimeoutMs?: number;
}

type Refusal = { readonly ok: false; readonly code: number; readonly reason: string };
type Admission = {
  readonly ok: true;
  readonly grant: AgentSessionGrant;
  readonly channel: AgentChannel;
  readonly release: () => void;
};

interface LiveSession {
  readonly socket: WebSocket;
  readonly proxy: PolicyProxy;
  readonly finished: Promise<void>;
}

/**
 * The agent bridge: `GET <base>/acp?agent=<id>&workspace=<slug>` upgrades to an ACP WebSocket for
 * one chat, after authenticating the browser's cookie with the API and minting an agent-session
 * token; `<base>/connections/<provider>/…` drives provider account sign-in; `GET <base>/health`
 * reports liveness.
 */
export class AgentBridge {
  readonly app: Express;
  readonly server: HttpServer;
  readonly #config: BridgeConfig;
  readonly #api: PlaneApi;
  readonly #transport: AgentTransport;
  readonly #log: Logger;
  readonly #wss: WebSocketServer;
  readonly #acp: AcpServer;
  readonly #sessions = new Set<LiveSession>();
  readonly #perUser = new Map<string, number>();
  readonly #initializeTimeoutMs: number;
  #pendingAdmissions = 0;
  #shuttingDown = false;

  constructor(options: AgentBridgeOptions) {
    const { config } = options;
    this.#config = config;
    this.#log = options.log ?? createLogger("agent-bridge");
    this.#initializeTimeoutMs = options.initializeTimeoutMs ?? 30_000;
    this.#api = options.api ?? createPlaneApi({ baseUrl: config.apiBaseUrl, bridgeSecret: config.bridgeSecret });
    this.#transport =
      options.transport ??
      new RunnerTransport({
        url: config.runnerUrl,
        secret: config.runnerSecret,
        maxMessageBytes: config.maxAgentMessageBytes,
      });
    // The SDK's AcpServer frames ACP over each accepted socket (initialize-first, no batches,
    // backpressure); the PolicyProxy is the "agent" it connects to.
    this.#acp = new AcpServer({
      createAgent: () => {
        throw new Error("every connection supplies its own proxy");
      },
      maxBufferedBytes: Math.max(64 * 1024 * 1024, config.maxMessageBytes * 4),
    });
    this.#wss = new WebSocketServer({ noServer: true, maxPayload: config.maxMessageBytes, perMessageDeflate: false });

    this.app = express();
    this.app.disable("x-powered-by");
    this.app.get(`${config.basePath}/health`, (_req, res) => {
      res.status(this.#shuttingDown ? 503 : 200).json({
        status: this.#shuttingDown ? "SHUTTING_DOWN" : "OK",
        version: config.version,
        connections: this.#sessions.size,
        timestamp: new Date().toISOString(),
      });
    });
    this.app.use(
      `${config.basePath}/connections`,
      connectionsRouter({
        api: this.#api,
        runner:
          options.loginRunner ?? new RunnerLoginClient({ baseUrl: config.runnerHttpUrl, secret: config.runnerSecret }),
        log: this.#log,
        allowedOrigins: config.allowedOrigins,
        startLimit: { max: config.loginStartLimit, windowMs: config.loginStartWindowMs },
      })
    );
    this.app.use((_req, res) => {
      res.status(404).json({ message: "Not Found" });
    });

    this.server = createServer(this.app);
    this.server.on("upgrade", (req: IncomingMessage, socket: Duplex, head: Buffer) => {
      this.#handleUpgrade(req, socket, head).catch((error: unknown) => {
        this.#log.error("agent-bridge: upgrade failed", { error: (error as Error).message });
        rejectHttp(socket, 500, "Internal Server Error");
      });
    });
  }

  get connectionCount(): number {
    return this.#sessions.size;
  }

  async listen(port = this.#config.port, host = this.#config.host): Promise<AddressInfo> {
    await new Promise<void>((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(port, host, () => {
        this.server.off("error", reject);
        resolve();
      });
    });
    const address = this.server.address() as AddressInfo;
    this.#log.info("agent-bridge: listening", { port: address.port, basePath: this.#config.basePath });
    return address;
  }

  /** Stop accepting connections, close the open ones (which revokes their tokens), then stop. */
  async close(): Promise<void> {
    if (this.#shuttingDown) return;
    this.#shuttingDown = true;
    const httpClosed = new Promise<void>((resolve) => this.server.close(() => resolve()));
    for (const session of this.#sessions) session.socket.close(CloseCode.goingAway, "Server shutting down");
    const drained = Promise.all([...this.#sessions].map((session) => session.finished));
    let timer: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([
      drained,
      new Promise((resolve) => {
        timer = setTimeout(resolve, SHUTDOWN_DEADLINE_MS);
      }),
    ]);
    clearTimeout(timer);
    await this.#acp.close();
    for (const client of this.#wss.clients) client.terminate();
    this.server.closeAllConnections();
    await httpClosed;
    this.#log.info("agent-bridge: stopped");
  }

  async #handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): Promise<void> {
    socket.on("error", () => undefined);
    const url = new URL(req.url ?? "/", "http://bridge.invalid");
    if (url.pathname !== `${this.#config.basePath}/acp`) return rejectHttp(socket, 404, "Not Found");
    if (this.#shuttingDown) return rejectHttp(socket, 503, "Service Unavailable");
    if (!originAllowed(req, this.#config.allowedOrigins)) {
      this.#log.warn("agent-bridge: refused cross-origin upgrade", { origin: req.headers.origin });
      return rejectHttp(socket, 403, "Forbidden");
    }

    // Abort the admission work if the browser gives up while we authenticate.
    const abort = new AbortController();
    const onGone = () => abort.abort();
    socket.once("close", onGone);
    this.#pendingAdmissions += 1;
    let admission: Admission | Refusal;
    try {
      admission = await this.#admit(req, url, abort.signal);
    } finally {
      this.#pendingAdmissions -= 1;
      socket.off("close", onGone);
    }

    if (abort.signal.aborted || socket.destroyed || this.#shuttingDown) {
      if (admission.ok) this.#discard(admission, "browser left during admission");
      socket.destroy();
      return;
    }

    this.#wss.handleUpgrade(req, socket, head, (ws) => {
      if (!admission.ok) {
        ws.close(admission.code, admission.reason);
        return;
      }
      this.#startSession(ws, admission);
    });
  }

  async #admit(req: IncomingMessage, url: URL, signal: AbortSignal): Promise<Admission | Refusal> {
    const agentId = url.searchParams.get("agent") ?? "";
    const workspaceSlug = url.searchParams.get("workspace") ?? "";
    if (!UUID.test(agentId) || !SLUG.test(workspaceSlug)) {
      return refuse(CloseCode.badRequest, "agent and workspace query parameters are required");
    }
    const cookie = req.headers.cookie;
    if (!cookie) return refuse(CloseCode.unauthenticated, "Not signed in");

    let userId: string;
    try {
      userId = (await this.#api.currentUser(cookie, signal)).id;
    } catch (error) {
      const status = error instanceof PlaneApiError ? error.status : 0;
      if (status === 401 || status === 403) return refuse(CloseCode.unauthenticated, "Not signed in");
      this.#log.error("agent-bridge: could not authenticate", { status, error: (error as Error).message });
      return refuse(CloseCode.internalError, "Authentication is unavailable");
    }

    if (this.#sessions.size + this.#pendingAdmissions > this.#config.maxConnections) {
      return refuse(CloseCode.tooManyConnections, "The agent service is at capacity");
    }
    const held = this.#perUser.get(userId) ?? 0;
    if (held >= this.#config.maxConnectionsPerUser) {
      return refuse(CloseCode.tooManyConnections, "Too many open agent chats");
    }
    this.#perUser.set(userId, held + 1);
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      const count = (this.#perUser.get(userId) ?? 1) - 1;
      if (count > 0) this.#perUser.set(userId, count);
      else this.#perUser.delete(userId);
    };

    let grant: AgentSessionGrant;
    try {
      grant = await this.#api.createAgentSession({ userId, workspaceSlug, agentId }, signal);
    } catch (error) {
      release();
      const status = error instanceof PlaneApiError ? error.status : 0;
      if (error instanceof PlaneApiError && error.isBridgeCredentialError) {
        this.#log.error("agent-bridge: the API rejected AGENT_BRIDGE_SECRET; check it matches the API's", { status });
        return refuse(CloseCode.internalError, "The agent service is misconfigured");
      }
      if (status === 400) return refuse(CloseCode.badRequest, "Invalid agent request");
      if (status === 403) return refuse(CloseCode.forbidden, "Not a member of this workspace");
      if (status === 404) return refuse(CloseCode.agentNotFound, "Agent not found or disabled");
      this.#log.error("agent-bridge: could not start an agent session", { status, error: (error as Error).message });
      return refuse(CloseCode.internalError, "Could not start the agent session");
    }

    const log = withMeta(this.#log, {
      sessionRef: grant.tokenId,
      userId,
      workspaceSlug,
      agentId,
      adapter: grant.agent.adapter,
    });
    let channel: AgentChannel;
    try {
      channel = await this.#transport.open(grant, signal);
    } catch (error) {
      release();
      void this.#revoke(grant, log);
      log.error("agent-bridge: agent runner unavailable", { error: (error as Error).message });
      return refuse(CloseCode.agentUnavailable, "The agent is unavailable");
    }
    return { ok: true, grant, channel, release };
  }

  #discard(admission: Admission, reason: string): void {
    admission.channel.close();
    admission.release();
    void this.#revoke(admission.grant, withMeta(this.#log, { sessionRef: admission.grant.tokenId }));
    this.#log.info("agent-bridge: admission discarded", { reason });
  }

  #startSession(ws: WebSocket, admission: Admission): void {
    const { grant, channel, release } = admission;
    const log = withMeta(this.#log, {
      sessionRef: grant.tokenId,
      userId: grant.user.id,
      workspaceSlug: grant.workspace.slug,
      agentId: grant.agent.id,
      adapter: grant.agent.adapter,
    });
    const mcpUrl = this.#config.planeMcpUrl || grant.mcp.url;
    const policy = new SessionPolicy({
      cwd: `${this.#config.workspacesRoot}/${grant.workspace.id}/${grant.user.id}`.replace(/^\/\//, "/"),
      defaultLevel: grant.agent.defaultPermissionLevel,
      maxLevel: grant.agent.maxPermissionLevel,
      attachPlaneMcp: grant.agent.attachPlaneMcp,
      planeMcp: mcpUrl
        ? { url: mcpUrl, token: grant.token, workspaceSlug: grant.mcp.workspaceSlug || grant.workspace.slug }
        : undefined,
    });
    const proxy = new PolicyProxy({
      policy,
      upstream: channel,
      log,
      idleTimeoutMs: this.#config.idleTimeoutMs,
      initializeTimeoutMs: this.#initializeTimeoutMs,
      expiresAt: grant.expiresAt,
      closeClient: (code, reason) => ws.close(code, reason),
    });

    const openedAt = Date.now();
    const finished = (async () => {
      await new Promise<void>((resolve) => ws.once("close", () => resolve()));
      proxy.close("client disconnected");
      release();
      await this.#revoke(grant, log);
      log.info("agent-bridge: session closed", {
        reason: proxy.closeReason,
        durationMs: Date.now() - openedAt,
      });
    })();
    const session: LiveSession = { socket: ws, proxy, finished };
    this.#sessions.add(session);
    void finished.finally(() => this.#sessions.delete(session));
    // Once the agent side closes, make sure the browser socket follows.
    void (async () => {
      await proxy.closed;
      if (ws.readyState === ws.OPEN) ws.close(CloseCode.normal, "Session ended");
    })();

    this.#keepAlive(ws);
    this.#acp.prepareWebSocketUpgrade({ agent: proxy }).accept(ws);
    log.info("agent-bridge: session opened", { expiresAt: grant.expiresAt.toISOString() });
  }

  /** Ping the browser; a peer that misses a whole interval is gone. Pings are not activity. */
  #keepAlive(ws: WebSocket): void {
    let alive = true;
    ws.on("pong", () => {
      alive = true;
    });
    const timer = setInterval(() => {
      if (!alive) {
        ws.terminate();
        return;
      }
      alive = false;
      ws.ping();
    }, this.#config.pingIntervalMs);
    timer.unref();
    ws.once("close", () => clearInterval(timer));
  }

  async #revoke(grant: AgentSessionGrant, log: Logger): Promise<void> {
    try {
      await this.#api.revokeAgentSession(grant.tokenId);
      log.info("agent-bridge: agent-session token revoked");
    } catch (error) {
      log.error("agent-bridge: could not revoke the agent-session token (it still expires on its own)", {
        error: (error as Error).message,
      });
    }
  }
}

function refuse(code: number, reason: string): Refusal {
  return { ok: false, code, reason };
}

function rejectHttp(socket: Duplex, status: number, message: string): void {
  if (!socket.writable) {
    socket.destroy();
    return;
  }
  socket.end(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
}
