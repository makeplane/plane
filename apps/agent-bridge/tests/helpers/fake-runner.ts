/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { TicketReplayGuard, ticketPurpose, verifySpawnTicket, type SpawnTicket } from "@plane/agent-runner-protocol";

export const RUNNER_SECRET = "r".repeat(40);

interface FakeLogin {
  readonly ticket: SpawnTicket;
  status: "pending" | "connected" | "failed";
  account?: Record<string, string>;
  error?: string;
  readonly needsCode: boolean;
}

const state = (login: FakeLogin) => ({
  status: login.status,
  ...(login.account ? { account: login.account } : {}),
  ...(login.error ? { error: login.error } : {}),
});

type Reply = { status: number; body?: unknown };

/**
 * The runner's `/auth/*` endpoints, reduced to a state table: verifies each request's single-use
 * `login` ticket like the runner does, and lets tests flip a sign-in to connected or failed.
 */
export class FakeLoginRunner {
  readonly calls: { route: string; ticket: SpawnTicket; body: Record<string, unknown> }[] = [];
  readonly logins = new Map<string, FakeLogin>();
  /** The next `/auth/<route>` call answers this instead. */
  readonly scripted = new Map<string, Reply>();
  /** What `GET account` reports: the stored sign-in, or `undefined` when there is none. */
  storedAccount: Record<string, string> | undefined = { email: "ada@example.com" };
  /** Codes `complete` accepts. */
  goodCode = "good-code";
  #server: Server | undefined;
  readonly #replay = new TicketReplayGuard();

  get url(): string {
    return `http://127.0.0.1:${(this.#server!.address() as AddressInfo).port}`;
  }

  async start(): Promise<this> {
    this.#server = createServer((req, res) => {
      void (async () => {
        const { status, body } = await this.#handle(req);
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(body === undefined ? "" : JSON.stringify(body));
      })();
    });
    await new Promise<void>((resolve) => this.#server!.listen(0, "127.0.0.1", resolve));
    return this;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.#server?.closeAllConnections();
      this.#server?.close(() => resolve());
    });
  }

  /** The only sign-in in progress (tests start one at a time). */
  latest(): [string, FakeLogin] {
    const entry = [...this.logins].at(-1);
    if (!entry) throw new Error("no sign-in started");
    return entry;
  }

  connect(account: Record<string, string> = { email: "ada@example.com", plan: "plus" }): void {
    const [, login] = this.latest();
    login.status = "connected";
    login.account = account;
  }

  async #handle(req: IncomingMessage): Promise<Reply> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const url = new URL(req.url ?? "/", "http://runner");
    const authorization = req.headers.authorization ?? "";
    const verified = verifySpawnTicket(authorization.replace(/^Bearer /, ""), RUNNER_SECRET);
    if (!verified.ok || ticketPurpose(verified.ticket) !== "login" || !this.#replay.claim(verified.ticket)) {
      return { status: 401, body: { error: "Unauthorized" } };
    }
    const { ticket } = verified;
    const route = url.pathname.replace(/^\/auth\//, "");
    const body = (chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}) as Record<string, unknown>;
    this.calls.push({ route, ticket, body });
    const scripted = this.scripted.get(route);
    if (scripted) {
      this.scripted.delete(route);
      return scripted;
    }
    const owned = (loginId: unknown) => {
      const login = typeof loginId === "string" ? this.logins.get(loginId) : undefined;
      const mine =
        login &&
        login.ticket.userId === ticket.userId &&
        login.ticket.workspaceId === ticket.workspaceId &&
        login.ticket.adapter === ticket.adapter;
      return mine ? login : undefined;
    };

    switch (`${req.method} ${route}`) {
      case "POST start": {
        const loginId = randomUUID();
        const gemini = ticket.adapter === "gemini";
        this.logins.set(loginId, { ticket, status: "pending", needsCode: gemini });
        return {
          status: 200,
          body: gemini
            ? { loginId, verificationUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=s3cr3t", needsCode: true }
            : {
                loginId,
                verificationUrl: "https://auth.openai.com/codex/device",
                userCode: "WXYZ-9876",
                needsCode: false,
              },
        };
      }
      case "GET status": {
        const login = owned(url.searchParams.get("loginId"));
        return login ? { status: 200, body: state(login) } : { status: 404, body: { error: "Unknown sign-in" } };
      }
      case "POST complete": {
        const login = owned(body.loginId);
        if (!login) return { status: 404, body: { error: "Unknown sign-in" } };
        if (!login.needsCode) return { status: 400, body: { error: "This sign-in does not take a code" } };
        if (login.status === "pending") {
          if (body.code === this.goodCode) {
            login.status = "connected";
            login.account = { email: "ada@example.com" };
          } else {
            login.status = "failed";
            login.error = "The code was not accepted";
          }
        }
        return { status: 200, body: state(login) };
      }
      case "POST logout":
        return { status: 200, body: { status: "disconnected" } };
      case "GET account":
        return {
          status: 200,
          body: this.storedAccount ? { connected: true, account: this.storedAccount } : { connected: false },
        };
      default:
        return { status: 404, body: { error: "Not Found" } };
    }
  }
}
