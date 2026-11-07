/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { AgentContext, PermissionOption, ToolCallUpdate, ToolKind } from "@agentclientprotocol/sdk";

import { requiresPermission, type PermissionModeId, type ToolCategory } from "./modes.ts";

export const PERMISSION_OPTIONS: readonly PermissionOption[] = [
  { optionId: "allow_once", name: "Allow once", kind: "allow_once" },
  { optionId: "allow_always", name: "Always allow this session", kind: "allow_always" },
  { optionId: "reject_once", name: "Deny", kind: "reject_once" },
];

export interface PermissionCheck {
  /** ACP tool call this request is about; it must already have been announced with `tool_call`. */
  readonly toolCallId: string;
  readonly title: string;
  readonly kind: ToolKind;
  readonly category: ToolCategory;
  readonly rawInput?: unknown;
  /**
   * What an "Always allow this session" answer covers, e.g. `Bash` or `mcp:plane:workitem:create`.
   * Defaults to the title.
   */
  readonly memoryKey?: string;
}

/**
 * `allowed`: run the tool. `rejected`: the user said no. `cancelled`: the turn was cancelled while
 * the prompt was open; the caller should stop the turn.
 */
export type PermissionDecision = "allowed" | "rejected" | "cancelled";

/**
 * Mode gate plus `session/request_permission`, with per-session "always allow" memory. One per
 * ACP session; the mode is read live so `session/set_mode` takes effect on the next tool call,
 * including mid-turn.
 */
export class PermissionGate {
  readonly #client: AgentContext;
  readonly #sessionId: string;
  readonly #mode: () => PermissionModeId;
  readonly #alwaysAllowed = new Set<string>();

  constructor(client: AgentContext, sessionId: string, mode: () => PermissionModeId) {
    this.#client = client;
    this.#sessionId = sessionId;
    this.#mode = mode;
  }

  /** True when `check` would answer without asking the user. */
  wouldAllowSilently(category: ToolCategory, memoryKey: string): boolean {
    return !requiresPermission(this.#mode(), category) || this.#alwaysAllowed.has(memoryKey);
  }

  async check(request: PermissionCheck, signal: AbortSignal): Promise<PermissionDecision> {
    if (signal.aborted) return "cancelled";
    const memoryKey = request.memoryKey ?? request.title;
    if (this.wouldAllowSilently(request.category, memoryKey)) return "allowed";

    const toolCall: ToolCallUpdate = {
      toolCallId: request.toolCallId,
      title: request.title,
      kind: request.kind,
      status: "pending",
      ...(request.rawInput === undefined ? {} : { rawInput: request.rawInput }),
    };
    let optionId: string;
    try {
      const response = await this.#client.request(
        "session/request_permission",
        { sessionId: this.#sessionId, toolCall, options: [...PERMISSION_OPTIONS] },
        { cancellationSignal: signal }
      );
      if (response.outcome.outcome === "cancelled") return "cancelled";
      optionId = response.outcome.optionId;
    } catch (error) {
      if (signal.aborted) return "cancelled";
      throw error;
    }
    if (signal.aborted) return "cancelled";
    if (optionId === "allow_always") {
      this.#alwaysAllowed.add(memoryKey);
      return "allowed";
    }
    return optionId === "allow_once" ? "allowed" : "rejected";
  }
}
