/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { AGENT_BRIDGE_BASE_PATH, AGENT_BRIDGE_BASE_URL } from "@plane/constants";
import type { TAgentAccountProvider, TAgentConnectionStart, TAgentConnectionStatus } from "@plane/types";

/** A bridge `connections` request failed. `status` is the HTTP status, or 0 when the bridge was unreachable. */
export class AgentConnectionError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AgentConnectionError";
    this.status = status;
  }
}

export type TAgentConnectionServiceOptions = {
  /** The bridge origin; empty means the page's own origin. Defaults to `AGENT_BRIDGE_BASE_URL`. */
  baseUrl?: string;
  /** The bridge mount path. Defaults to `AGENT_BRIDGE_BASE_PATH`. */
  basePath?: string;
  /** Injectable for tests. Defaults to the global `fetch`. */
  fetch?: typeof fetch;
};

/**
 * The bridge URL for `path` (e.g. `/connections/openai/start`). Like the chat socket URL, only the
 * origin of `baseUrl` is used and `basePath` (default `/agents`) is the mount path. Without a base URL
 * the URL is relative to the page's origin.
 */
export function agentBridgeHttpUrl(baseUrl: string | undefined, basePath: string | undefined, path: string): string {
  const mount = (basePath?.trim() || "/agents").replace(/\/+$/, "");
  const pathname = `${mount.startsWith("/") ? mount : `/${mount}`}${path}`;
  const origin = baseUrl?.trim() ? new URL(baseUrl.trim()).origin : "";
  return `${origin}${pathname}`;
}

/**
 * Account sign-ins (ChatGPT, Google) for the agent chat, run by the agent bridge as the signed-in
 * user. Requests carry the session cookie; the bridge checks workspace membership.
 */
export class AgentConnectionService {
  private readonly baseUrl: string;
  private readonly basePath: string;
  private readonly fetchImpl: typeof fetch | undefined;

  constructor(options: TAgentConnectionServiceOptions = {}) {
    this.baseUrl = options.baseUrl ?? AGENT_BRIDGE_BASE_URL;
    this.basePath = options.basePath ?? AGENT_BRIDGE_BASE_PATH;
    this.fetchImpl = options.fetch;
  }

  /** Starts a sign-in. A new start replaces any sign-in still pending for this provider. */
  async start(provider: TAgentAccountProvider, workspaceSlug: string): Promise<TAgentConnectionStart> {
    return this.request<TAgentConnectionStart>(provider, "start", {
      method: "POST",
      body: { workspace: workspaceSlug },
    });
  }

  /** Where a sign-in stands. A `connected` result also saves the account for the member. */
  async status(
    provider: TAgentAccountProvider,
    workspaceSlug: string,
    loginId: string,
    signal?: AbortSignal
  ): Promise<TAgentConnectionStatus> {
    const query = new URLSearchParams({ workspace: workspaceSlug, loginId });
    return this.request<TAgentConnectionStatus>(provider, `status?${query.toString()}`, { method: "GET", signal });
  }

  /** Sends the code the sign-in page showed (flows with `needsCode`). */
  async complete(
    provider: TAgentAccountProvider,
    workspaceSlug: string,
    loginId: string,
    code: string
  ): Promise<TAgentConnectionStatus> {
    return this.request<TAgentConnectionStatus>(provider, "complete", {
      method: "POST",
      body: { workspace: workspaceSlug, loginId, code },
    });
  }

  /** Signs the account out on the runner and forgets it for the member. */
  async disconnect(provider: TAgentAccountProvider, workspaceSlug: string): Promise<void> {
    await this.request<void>(provider, "disconnect", { method: "POST", body: { workspace: workspaceSlug } });
  }

  private async request<T>(
    provider: TAgentAccountProvider,
    action: string,
    options: { method: "GET" | "POST"; body?: Record<string, string>; signal?: AbortSignal | undefined }
  ): Promise<T> {
    const url = agentBridgeHttpUrl(this.baseUrl, this.basePath, `/connections/${provider}/${action}`);
    const fetchImpl = this.fetchImpl ?? globalThis.fetch.bind(globalThis);
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: options.method,
        credentials: "include",
        headers: options.body ? { "Content-Type": "application/json" } : {},
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        ...(options.signal ? { signal: options.signal } : {}),
      });
    } catch (error) {
      if (options.signal?.aborted) throw error;
      throw new AgentConnectionError(0, error instanceof Error ? error.message : "The agent bridge is unreachable.");
    }
    if (response.status === 204) return undefined as T;
    const data: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
      const message =
        data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : response.statusText || `Request failed with status ${response.status}`;
      throw new AgentConnectionError(response.status, message);
    }
    return data as T;
  }
}
