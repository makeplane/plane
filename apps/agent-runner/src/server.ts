/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createServer, type IncomingMessage, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Duplex } from "node:stream";

import { AcpServer } from "@agentclientprotocol/sdk/experimental/server";
import { TicketReplayGuard, verifySpawnTicket, type SpawnTicket } from "@plane/agent-runner-protocol";
import express, { type Express } from "express";
import { WebSocketServer } from "ws";

import {
  AgentProcess,
  defaultKiller,
  procProcessLister,
  reapUid,
  type Killer,
  type ProcessLister,
  type Spawner,
} from "./agent-process.ts";
import { createAdapterResolver, type ResolveAgentCommand } from "./bins.ts";
import type { RunnerConfig } from "./config.ts";
import { buildAgentEnv } from "./env.ts";
import { createLogger, withMeta, type Logger } from "./logger.ts";
import { WorkspaceManager, type Chown } from "./workspace.ts";

export const ACP_PATH = "/acp";
const SHUTDOWN_DEADLINE_MS = 10_000;

export interface AgentRunnerOptions {
  readonly config: RunnerConfig;
  readonly log?: Logger;
  /** Adapter → command; defaults to the fixed `@plane/acp-adapters` bins. */
  readonly resolveCommand?: ResolveAgentCommand;
  readonly spawner?: Spawner;
  readonly chown?: Chown;
  readonly killer?: Killer;
  readonly listProcesses?: ProcessLister;
}

interface RunningAgent {
  readonly process: AgentProcess;
  readonly ticket: SpawnTicket;
  readonly uid: number | undefined;
}

/**
 * The agent runner: `GET /acp` upgrades to ACP-over-WebSocket for one agent, started from a
 * verified spawn ticket; `GET /health` reports liveness. It has no other API and makes no
 * decisions about who may use which agent: that is the bridge's job, and the ticket is its word.
 */
export class AgentRunner {
  readonly app: Express;
  readonly server: HttpServer;
  readonly workspaces: WorkspaceManager;
  readonly #config: RunnerConfig;
  readonly #log: Logger;
  readonly #resolve: ResolveAgentCommand;
  readonly #spawner: Spawner | undefined;
  readonly #kill: Killer;
  readonly #listProcesses: ProcessLister;
  readonly #wss: WebSocketServer;
  readonly #acp: AcpServer;
  readonly #replay = new TicketReplayGuard();
  readonly #agents = new Set<RunningAgent>();
  readonly #uidLeases = new Map<number, number>();
  #pending = 0;
  #shuttingDown = false;

  constructor(options: AgentRunnerOptions) {
    const { config } = options;
    this.#config = config;
    this.#log = options.log ?? createLogger("agent-runner");
    if (options.resolveCommand) {
      this.#resolve = options.resolveCommand;
    } else {
      const resolver = createAdapterResolver({ enableEcho: config.enableEcho });
      if (resolver.missing.length > 0) {
        this.#log.error("agent-runner: adapter bins are missing (is @plane/acp-adapters built?)", {
          adapters: resolver.missing,
        });
      }
      this.#resolve = resolver.resolve;
    }
    this.#spawner = options.spawner;
    this.#kill = options.killer ?? defaultKiller;
    this.#listProcesses = options.listProcesses ?? procProcessLister;
    this.workspaces = new WorkspaceManager({
      root: config.workspacesRoot,
      isolation: config.isolation,
      uidRange: config.uidRange,
      ...(options.chown ? { chown: options.chown } : {}),
    });
    this.#acp = new AcpServer({
      createAgent: () => {
        throw new Error("every connection supplies its own agent process");
      },
      maxBufferedBytes: Math.max(64 * 1024 * 1024, config.maxMessageBytes * 4),
    });
    this.#wss = new WebSocketServer({ noServer: true, maxPayload: config.maxMessageBytes, perMessageDeflate: false });

    this.app = express();
    this.app.disable("x-powered-by");
    this.app.get("/health", (_req, res) => {
      res.status(this.#shuttingDown ? 503 : 200).json({
        status: this.#shuttingDown ? "SHUTTING_DOWN" : "OK",
        version: config.version,
        agents: this.#agents.size,
        isolation: config.isolation,
      });
    });
    this.app.use((_req, res) => {
      res.status(404).json({ message: "Not Found" });
    });

    this.server = createServer({ maxHeaderSize: config.maxHeaderBytes }, this.app);
    this.server.on("upgrade", (req: IncomingMessage, socket: Duplex, head: Buffer) => {
      this.#handleUpgrade(req, socket, head).catch((error: unknown) => {
        this.#log.error("agent-runner: upgrade failed", { error: (error as Error).message });
        rejectHttp(socket, 500, "Internal Server Error");
      });
    });
  }

  /** Live agent processes (pid and correlation id), for health checks and tests. */
  agents(): { pid: number | undefined; sessionRef: string | undefined; uid: number | undefined }[] {
    return [...this.#agents].map((agent) => ({
      pid: agent.process.pid,
      sessionRef: agent.ticket.sessionRef,
      uid: agent.uid,
    }));
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
    this.#log.info("agent-runner: listening", { port: address.port, isolation: this.#config.isolation });
    return address;
  }

  /** Stop accepting, stop every agent (process groups included), then close. */
  async close(): Promise<void> {
    if (this.#shuttingDown) return;
    this.#shuttingDown = true;
    const httpClosed = new Promise<void>((resolve) => this.server.close(() => resolve()));
    const agents = [...this.#agents];
    for (const agent of agents) agent.process.terminate("runner shutting down");
    let timer: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([
      Promise.all(agents.map((agent) => agent.process.exited)),
      new Promise((resolve) => {
        timer = setTimeout(resolve, SHUTDOWN_DEADLINE_MS);
      }),
    ]);
    clearTimeout(timer);
    await this.#acp.close();
    for (const client of this.#wss.clients) client.terminate();
    this.server.closeAllConnections();
    await httpClosed;
    this.#log.info("agent-runner: stopped");
  }

  async #handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): Promise<void> {
    socket.on("error", () => undefined);
    const url = new URL(req.url ?? "/", "http://runner.invalid");
    if (url.pathname !== ACP_PATH) return rejectHttp(socket, 404, "Not Found");
    if (this.#shuttingDown) return rejectHttp(socket, 503, "Service Unavailable");

    const authorization = req.headers.authorization ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
    const verified = verifySpawnTicket(token, this.#config.secret);
    if (!verified.ok) {
      this.#log.warn("agent-runner: refused spawn ticket", { reason: verified.reason });
      return rejectHttp(socket, 401, "Unauthorized");
    }
    const { ticket } = verified;
    if (!this.#replay.claim(ticket)) {
      this.#log.warn("agent-runner: refused replayed spawn ticket", { sessionRef: ticket.sessionRef });
      return rejectHttp(socket, 401, "Unauthorized");
    }
    const log = withMeta(this.#log, {
      sessionRef: ticket.sessionRef,
      adapter: ticket.adapter,
      workspaceId: ticket.workspaceId,
      userId: ticket.userId,
    });
    const command = this.#resolve(ticket.adapter);
    if (!command) {
      log.warn("agent-runner: unknown or disabled adapter");
      return rejectHttp(socket, 400, "Bad Request");
    }
    if (this.#agents.size + this.#pending >= this.#config.maxConnections) {
      log.warn("agent-runner: at capacity");
      return rejectHttp(socket, 503, "Service Unavailable");
    }

    this.#pending += 1;
    let layout;
    try {
      layout = await this.workspaces.prepare(ticket.workspaceId, ticket.userId);
    } finally {
      this.#pending -= 1;
    }
    if (socket.destroyed || this.#shuttingDown) {
      socket.destroy();
      return;
    }
    const { env, dropped } = buildAgentEnv({
      agentEnv: ticket.env,
      layout,
      initialMode: ticket.initialMode,
      path: this.#config.agentPath,
      shell: this.#config.agentShell,
    });
    if (dropped.length > 0) log.warn("agent-runner: dropped reserved agent env names", { names: dropped });

    const uid = layout.uid;
    const agentProcess = new AgentProcess({
      command,
      layout,
      env,
      killGraceMs: this.#config.killGraceMs,
      maxMessageBytes: this.#config.maxMessageBytes,
      log,
      ...(this.#spawner ? { spawner: this.#spawner } : {}),
      killer: this.#kill,
      onExit: () => {
        this.#agents.delete(running);
        if (uid !== undefined) void this.#releaseUid(uid, log);
      },
    });
    const running: RunningAgent = { process: agentProcess, ticket, uid };

    this.#wss.handleUpgrade(req, socket, head, (ws) => {
      this.#agents.add(running);
      if (uid !== undefined) this.#uidLeases.set(uid, (this.#uidLeases.get(uid) ?? 0) + 1);
      ws.once("close", () => agentProcess.terminate("connection closed"));
      // AcpServer frames ACP on the socket (initialize first, no batches, backpressure) and
      // connects it to the agent process, which spawns here.
      this.#acp.prepareWebSocketUpgrade({ agent: agentProcess }).accept(ws);
    });
  }

  async #releaseUid(uid: number, log: Logger): Promise<void> {
    const left = (this.#uidLeases.get(uid) ?? 1) - 1;
    if (left > 0) {
      this.#uidLeases.set(uid, left);
      return;
    }
    this.#uidLeases.delete(uid);
    try {
      // A new connection for the same dir may have started while we listed processes.
      const killed = await reapUid(uid, this.#listProcesses, this.#kill, () => !this.#uidLeases.has(uid));
      if (killed > 0) log.info("agent-runner: reaped leftover processes", { uid, count: killed });
    } catch (error) {
      log.error("agent-runner: reaping failed", { uid, error: (error as Error).message });
    }
  }
}

function rejectHttp(socket: Duplex, status: number, message: string): void {
  if (!socket.writable) {
    socket.destroy();
    return;
  }
  socket.end(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
}
