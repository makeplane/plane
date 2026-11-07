/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { RequestError, type McpServerHttp, type SessionUpdate } from "@agentclientprotocol/sdk";
import {
  INITIAL_MODE_META_KEY,
  clampPermissionLevel,
  isPermissionLevel,
  permissionRank,
  type PermissionLevel,
} from "@plane/agent-runner-protocol";

/**
 * What the bridge lets through, per direction. Everything else is refused: requests get a
 * `-32601` answer from the bridge, notifications and stray responses are dropped.
 *
 * - `fs/*` and `terminal/*` never pass: the browser has no files or terminals to offer, and the
 *   bridge also forces `clientCapabilities.fs/terminal` off so agents do not ask.
 * - `authenticate`/`logout` never pass: credentials come from the admin's agent config.
 * - `elicitation/*` and `_`-prefixed extension methods are not part of the chat contract.
 */
export const CLIENT_REQUESTS: ReadonlySet<string> = new Set([
  "initialize",
  "session/new",
  "session/load",
  "session/resume",
  "session/list",
  "session/close",
  "session/delete",
  "session/set_mode",
  "session/set_config_option",
  "session/prompt",
]);
export const CLIENT_NOTIFICATIONS: ReadonlySet<string> = new Set(["session/cancel", "$/cancel_request"]);
export const AGENT_REQUESTS: ReadonlySet<string> = new Set(["session/request_permission"]);
export const AGENT_NOTIFICATIONS: ReadonlySet<string> = new Set(["session/update", "$/cancel_request"]);

export const SESSION_SETUP_METHODS: ReadonlySet<string> = new Set(["session/new", "session/load", "session/resume"]);

/** Name of the Plane MCP server entry the bridge appends. */
export const PLANE_MCP_SERVER_NAME = "plane";

export interface PolicyContext {
  /** The ACP `cwd` for every session: the user's persistent dir on the runner. */
  readonly cwd: string;
  readonly defaultLevel: PermissionLevel;
  readonly maxLevel: PermissionLevel;
  /** Whether the admin wants Plane MCP attached to this agent. */
  readonly attachPlaneMcp: boolean;
  /** Plane MCP endpoint and credentials; `undefined` when the instance has no MCP URL configured. */
  readonly planeMcp?: { readonly url: string; readonly token: string; readonly workspaceSlug: string } | undefined;
}

type Params = Record<string, unknown>;

function isRecord(value: unknown): value is Params {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asParams(value: unknown): Params {
  return isRecord(value) ? { ...value } : {};
}

/**
 * Per-connection policy state. Pure apart from what it learns from `initialize`; the proxy calls
 * it for every request it forwards and every response it relays.
 */
export class SessionPolicy {
  readonly #ctx: PolicyContext;
  /** The browser advertised `clientCapabilities.session.notices`. */
  clientSupportsNotices = false;
  /** The agent advertised `agentCapabilities.mcpCapabilities.http`. */
  agentSupportsHttpMcp = false;

  constructor(ctx: PolicyContext) {
    this.#ctx = ctx;
  }

  get context(): PolicyContext {
    return this.#ctx;
  }

  /** Force the client capabilities: no filesystem, no terminal, no elicitation or auth flows. */
  rewriteInitialize(params: unknown): Params {
    const next = asParams(params);
    const caps = asParams(next.clientCapabilities);
    const session = isRecord(caps.session) ? caps.session : undefined;
    this.clientSupportsNotices = isRecord(session) && isRecord(session.notices);
    next.clientCapabilities = {
      fs: { readTextFile: false, writeTextFile: false },
      terminal: false,
      ...(session ? { session } : {}),
    };
    return next;
  }

  observeInitializeResult(result: unknown): void {
    const caps = isRecord(result) && isRecord(result.agentCapabilities) ? result.agentCapabilities : {};
    this.agentSupportsHttpMcp = isRecord(caps.mcpCapabilities) && caps.mcpCapabilities.http === true;
  }

  /** The Plane MCP entry to attach, or `undefined` when it must not or cannot be attached. */
  planeMcpServer(): McpServerHttp | undefined {
    const mcp = this.#ctx.planeMcp;
    if (!this.#ctx.attachPlaneMcp || !mcp || !this.agentSupportsHttpMcp) return undefined;
    return {
      type: "http",
      name: PLANE_MCP_SERVER_NAME,
      url: mcp.url,
      headers: [
        { name: "Authorization", value: `Bearer ${mcp.token}` },
        { name: "X-Workspace-slug", value: mcp.workspaceSlug },
      ],
    } as McpServerHttp;
  }

  /**
   * `session/new|load|resume`: pin `cwd`, drop extra directories and any MCP servers the browser
   * asked for (a stdio entry would be a command run on the runner), append Plane MCP, and pick
   * the starting mode: the browser's `_meta` choice or the admin default, clamped to the maximum.
   */
  rewriteSessionSetup(params: unknown): Params {
    const next = asParams(params);
    next.cwd = this.#ctx.cwd;
    delete next.additionalDirectories;
    const plane = this.planeMcpServer();
    next.mcpServers = plane ? [plane] : [];
    const meta = asParams(next._meta);
    const requested = meta[INITIAL_MODE_META_KEY];
    const start = isPermissionLevel(requested) ? requested : this.#ctx.defaultLevel;
    meta[INITIAL_MODE_META_KEY] = clampPermissionLevel(start, this.#ctx.maxLevel);
    next._meta = meta;
    return next;
  }

  /** `session/list` only ever lists this user's dir. */
  rewriteSessionList(params: unknown): Params {
    const next = asParams(params);
    next.cwd = this.#ctx.cwd;
    return next;
  }

  /** `session/set_mode`: refuse anything above the admin maximum, and ids that are not ours. */
  checkSetMode(params: unknown): void {
    const modeId = asParams(params).modeId;
    if (!isPermissionLevel(modeId)) {
      throw RequestError.invalidParams({ modeId }, "Unknown permission level");
    }
    if (permissionRank(modeId) > permissionRank(this.#ctx.maxLevel)) {
      throw RequestError.invalidParams(
        { modeId, maxModeId: this.#ctx.maxLevel },
        `Permission level "${modeId}" is above the maximum ("${this.#ctx.maxLevel}") an admin allows for this agent`
      );
    }
  }

  /** Drop modes above the maximum (and ones the bridge does not know) from a session setup result. */
  filterSessionResult(result: unknown): unknown {
    if (!isRecord(result) || !isRecord(result.modes) || !Array.isArray(result.modes.availableModes)) return result;
    const max = permissionRank(this.#ctx.maxLevel);
    const availableModes = result.modes.availableModes.filter(
      (mode: unknown) => isRecord(mode) && isPermissionLevel(mode.id) && permissionRank(mode.id) <= max
    );
    return { ...result, modes: { ...result.modes, availableModes } };
  }

  /**
   * The notice to show after a session setup when the admin asked for Plane MCP but it could not
   * be attached. As a `notice` update when the browser supports them, else an agent message.
   */
  mcpNotice(): SessionUpdate | undefined {
    if (!this.#ctx.attachPlaneMcp) return undefined;
    let description: string;
    if (!this.#ctx.planeMcp) {
      description = "Plane MCP is not configured on this instance, so the agent cannot read or change Plane data.";
    } else if (!this.agentSupportsHttpMcp) {
      description = "This agent does not support HTTP MCP servers, so it cannot read or change Plane data.";
    } else {
      return undefined;
    }
    const title = "Plane tools unavailable";
    if (this.clientSupportsNotices) {
      return { sessionUpdate: "notice", severity: "warning", title, description } as SessionUpdate;
    }
    return {
      sessionUpdate: "agent_message_chunk",
      content: { type: "text", text: `${title}: ${description}` },
      _meta: { "plane/notice": true },
    } as SessionUpdate;
  }
}
