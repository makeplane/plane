/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";

export const BRIDGE_SECRET = "bridge-secret-for-tests";
export const USER_ID = "11111111-1111-4111-8111-111111111111";
export const OTHER_USER_ID = "44444444-4444-4444-8444-444444444444";
export const WORKSPACE_ID = "22222222-2222-4222-8222-222222222222";
export const WORKSPACE_SLUG = "acme";
export const AGENT_ID = "33333333-3333-4333-8333-333333333333";
export const DISABLED_AGENT_ID = "55555555-5555-4555-8555-555555555555";
export const USER_COOKIE = "session-id=user-session";
export const OUTSIDER_COOKIE = "session-id=outsider-session";
export const MCP_URL = "http://mcp.internal:8211/mcp";

export interface StubAgent {
  adapter: string;
  env: Record<string, string>;
  default_permission_level: string;
  max_permission_level: string;
  attach_plane_mcp: boolean;
}

/**
 * Stands in for the Plane API: `/api/users/me/` by cookie, and the internal agent-session
 * endpoints with the same status codes as `AgentSessionEndpoint`.
 */
export class StubPlaneApi {
  readonly minted: { tokenId: string; token: string; userId: string; agentId: string }[] = [];
  readonly revoked: string[] = [];
  readonly users = new Map([
    [USER_COOKIE, USER_ID],
    [OUTSIDER_COOKIE, OTHER_USER_ID],
  ]);
  readonly members = new Set([USER_ID]);
  readonly agents = new Map<string, StubAgent>();
  /** `PUT|DELETE /api/internal/agent-connections/` bodies, in order. */
  readonly connections: { method: string; body: Record<string, string> }[] = [];
  /** Answer the agent-connections endpoints with this status instead (e.g. 500). */
  connectionsStatus: number | undefined;
  mcpUrl = MCP_URL;
  expiresInMs = 2 * 60 * 60_000;
  #server: Server | undefined;
  #seq = 0;

  constructor(agent: Partial<StubAgent> = {}) {
    this.agents.set(AGENT_ID, {
      adapter: "echo",
      env: { ANTHROPIC_API_KEY: "sk-ant-never-log-me" },
      default_permission_level: "ask_writes",
      max_permission_level: "ask_writes",
      attach_plane_mcp: true,
      ...agent,
    });
  }

  get url(): string {
    const address = this.#server?.address() as AddressInfo;
    return `http://127.0.0.1:${address.port}`;
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

  async #handle(req: IncomingMessage): Promise<{ status: number; body?: unknown }> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const url = new URL(req.url ?? "/", "http://api");
    if (req.method === "GET" && url.pathname === "/api/users/me/") {
      const userId = this.users.get(String(req.headers.cookie ?? ""));
      return userId ? { status: 200, body: { id: userId, display_name: "Ada" } } : { status: 401, body: {} };
    }
    if (url.pathname.startsWith("/api/internal/agent-connections/")) {
      if (req.headers["x-agent-bridge-secret"] !== BRIDGE_SECRET) {
        return { status: 403, body: { detail: "Invalid agent bridge credentials." } };
      }
      if (this.connectionsStatus) return { status: this.connectionsStatus, body: {} };
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as Record<string, string>;
      if (!body.user_id || !body.workspace_slug) return { status: 400, body: {} };
      const member = this.members.has(body.user_id) && body.workspace_slug === WORKSPACE_SLUG;
      if (!member) return { status: 403, body: { error: "User is not an active member of this workspace." } };
      if (req.method === "POST" && url.pathname === "/api/internal/agent-connections/authorize/") {
        return {
          status: 200,
          body: { user: { id: body.user_id }, workspace: { id: WORKSPACE_ID, slug: WORKSPACE_SLUG } },
        };
      }
      if (url.pathname !== "/api/internal/agent-connections/") return { status: 404, body: {} };
      if (req.method === "PUT") {
        const valid =
          (body.provider === "openai" && body.method === "chatgpt") ||
          (body.provider === "google" && body.method === "google_account");
        if (!valid) return { status: 400, body: {} };
        this.connections.push({ method: "PUT", body });
        return { status: 200, body: {} };
      }
      if (req.method === "DELETE") {
        this.connections.push({ method: "DELETE", body });
        return { status: 204 };
      }
      return { status: 405, body: {} };
    }
    if (url.pathname.startsWith("/api/internal/agent-sessions/")) {
      if (req.headers["x-agent-bridge-secret"] !== BRIDGE_SECRET) {
        return { status: 403, body: { detail: "Invalid agent bridge credentials." } };
      }
      if (req.method === "DELETE") {
        const tokenId = url.pathname.split("/").at(-2) ?? "";
        this.revoked.push(tokenId);
        return { status: this.minted.some((m) => m.tokenId === tokenId) ? 204 : 404 };
      }
      if (req.method === "POST") {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as Record<string, string>;
        if (!body.user_id || !body.workspace_slug || !body.agent_id) return { status: 400, body: {} };
        if (!this.members.has(body.user_id) || body.workspace_slug !== WORKSPACE_SLUG) {
          return { status: 403, body: { error: "User is not an active member of this workspace." } };
        }
        const agent = this.agents.get(body.agent_id);
        if (!agent) return { status: 404, body: {} };
        this.#seq += 1;
        const tokenId = `00000000-0000-4000-8000-${String(this.#seq).padStart(12, "0")}`;
        const token = `plane_api_token_${this.#seq}`;
        this.minted.push({ tokenId, token, userId: body.user_id, agentId: body.agent_id });
        return {
          status: 201,
          body: {
            token_id: tokenId,
            token,
            expires_at: new Date(Date.now() + this.expiresInMs).toISOString(),
            workspace: { id: WORKSPACE_ID, slug: WORKSPACE_SLUG },
            user: { id: body.user_id },
            agent: { id: body.agent_id, ...agent },
            mcp: { url: this.mcpUrl, workspace_slug: WORKSPACE_SLUG },
          },
        };
      }
    }
    return { status: 404, body: {} };
  }
}
