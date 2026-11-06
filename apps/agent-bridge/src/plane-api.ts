/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PERMISSION_LEVELS, type PermissionLevel } from "@plane/agent-runner-protocol";
import { z } from "zod";

/** Header the API's `AgentBridgeSecretPermission` checks. */
export const BRIDGE_SECRET_HEADER = "X-Agent-Bridge-Secret";

/** A non-2xx answer (or no answer) from the Plane API. `status` is 0 for network failures. */
export class PlaneApiError extends Error {
  readonly status: number;
  /** The API's own explanation (`detail` or `error` in the body), when it gave one. */
  readonly detail: string | undefined;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "PlaneApiError";
    this.status = status;
    this.detail = detail;
  }

  /** The API refused the bridge itself (wrong or unset `AGENT_BRIDGE_SECRET`), not the user. */
  get isBridgeCredentialError(): boolean {
    return (this.status === 401 || this.status === 403) && /agent bridge credentials/i.test(this.detail ?? "");
  }
}

async function errorFor(response: Response, what: string): Promise<PlaneApiError> {
  let detail: string | undefined;
  try {
    const body = (await response.json()) as { detail?: unknown; error?: unknown };
    const text = body.detail ?? body.error;
    if (typeof text === "string") detail = text.slice(0, 300);
  } catch {
    // Not JSON; the status says enough.
  }
  return new PlaneApiError(`${what} answered ${response.status}`, response.status, detail);
}

/** What `POST /api/internal/agent-sessions/` grants one chat connection. */
export interface AgentSessionGrant {
  readonly tokenId: string;
  /** Short-lived, workspace-scoped API token the agent uses for Plane MCP. Never logged. */
  readonly token: string;
  readonly expiresAt: Date;
  readonly workspace: { readonly id: string; readonly slug: string };
  readonly user: { readonly id: string };
  readonly agent: {
    readonly id: string;
    readonly adapter: string;
    /** Decrypted provider env (API keys). Never logged. */
    readonly env: Readonly<Record<string, string>>;
    readonly defaultPermissionLevel: PermissionLevel;
    readonly maxPermissionLevel: PermissionLevel;
    readonly attachPlaneMcp: boolean;
  };
  readonly mcp: { readonly url: string; readonly workspaceSlug: string };
}

export interface PlaneApi {
  /** The signed-in user behind a browser cookie (`GET /api/users/me/`). */
  currentUser(cookie: string, signal?: AbortSignal): Promise<{ id: string }>;
  createAgentSession(
    input: { userId: string; workspaceSlug: string; agentId: string },
    signal?: AbortSignal
  ): Promise<AgentSessionGrant>;
  revokeAgentSession(tokenId: string): Promise<void>;
}

const level = z.enum(PERMISSION_LEVELS);

const grantSchema = z.object({
  token_id: z.string().min(1),
  token: z.string().min(1),
  expires_at: z.string().min(1),
  workspace: z.object({ id: z.string().min(1), slug: z.string().min(1) }),
  user: z.object({ id: z.string().min(1) }),
  agent: z.object({
    id: z.string().min(1),
    adapter: z.string().min(1),
    env: z.record(z.string(), z.string()),
    default_permission_level: level,
    max_permission_level: level,
    attach_plane_mcp: z.boolean(),
  }),
  mcp: z.object({ url: z.string(), workspace_slug: z.string() }),
});

const userSchema = z.object({ id: z.string().min(1) });

export interface PlaneApiOptions {
  readonly baseUrl: string;
  readonly bridgeSecret: string;
  readonly timeoutMs?: number;
  readonly fetch?: typeof fetch;
}

export function createPlaneApi(options: PlaneApiOptions): PlaneApi {
  const base = options.baseUrl.replace(/\/+$/, "");
  const doFetch = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? 15_000;

  const call = async (path: string, init: RequestInit, signal?: AbortSignal): Promise<Response> => {
    const timeout = AbortSignal.timeout(timeoutMs);
    try {
      return await doFetch(`${base}${path}`, {
        ...init,
        redirect: "manual",
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
    } catch (error) {
      throw new PlaneApiError(`Plane API request failed: ${(error as Error).message}`, 0);
    }
  };

  const json = async (response: Response, what: string): Promise<unknown> => {
    try {
      return await response.json();
    } catch {
      throw new PlaneApiError(`${what}: response is not JSON`, response.status);
    }
  };

  return {
    async currentUser(cookie, signal) {
      const response = await call(
        "/api/users/me/",
        { method: "GET", headers: { Cookie: cookie, Accept: "application/json" } },
        signal
      );
      if (!response.ok) throw await errorFor(response, "users/me");
      const parsed = userSchema.safeParse(await json(response, "users/me"));
      if (!parsed.success) throw new PlaneApiError("users/me: unexpected response", 502);
      return { id: parsed.data.id };
    },

    async createAgentSession(input, signal) {
      const response = await call(
        "/api/internal/agent-sessions/",
        {
          method: "POST",
          headers: {
            [BRIDGE_SECRET_HEADER]: options.bridgeSecret,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            user_id: input.userId,
            workspace_slug: input.workspaceSlug,
            agent_id: input.agentId,
          }),
        },
        signal
      );
      if (!response.ok) throw await errorFor(response, "agent-sessions");
      const parsed = grantSchema.safeParse(await json(response, "agent-sessions"));
      if (!parsed.success) throw new PlaneApiError("agent-sessions: unexpected response", 502);
      const g = parsed.data;
      const expiresAt = new Date(g.expires_at);
      if (Number.isNaN(expiresAt.getTime())) throw new PlaneApiError("agent-sessions: invalid expires_at", 502);
      return {
        tokenId: g.token_id,
        token: g.token,
        expiresAt,
        workspace: g.workspace,
        user: g.user,
        agent: {
          id: g.agent.id,
          adapter: g.agent.adapter,
          env: g.agent.env,
          defaultPermissionLevel: g.agent.default_permission_level,
          maxPermissionLevel: g.agent.max_permission_level,
          attachPlaneMcp: g.agent.attach_plane_mcp,
        },
        mcp: { url: g.mcp.url, workspaceSlug: g.mcp.workspace_slug },
      };
    },

    async revokeAgentSession(tokenId) {
      let lastError: PlaneApiError | undefined;
      // One retry: a token left alive still expires on its own, but revoking promptly is the point.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        // oxlint-disable-next-line no-await-in-loop -- sequential retry
        const response = await call(`/api/internal/agent-sessions/${encodeURIComponent(tokenId)}/`, {
          method: "DELETE",
          headers: { [BRIDGE_SECRET_HEADER]: options.bridgeSecret },
        }).catch((error: PlaneApiError) => error);
        if (response instanceof PlaneApiError) {
          lastError = response;
          continue;
        }
        // 404: already gone (or never an agent-session token); nothing left to revoke.
        if (response.ok || response.status === 404) return;
        lastError = new PlaneApiError(`revoke answered ${response.status}`, response.status);
        if (response.status < 500) break;
      }
      throw lastError ?? new PlaneApiError("revoke failed", 0);
    },
  };
}
