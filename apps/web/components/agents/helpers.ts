/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describeClose } from "@plane/acp-client";
import type { AgentCloseReason, CloseInfo, PermissionOption, SessionMode } from "@plane/acp-client";
import { AGENT_PERMISSION_LEVELS } from "@plane/constants";
import type { TAgentPermissionLevel } from "@plane/types";
import type { TAgentChatError } from "@/store/agent-chat.store";

type TTranslate = (key: string, params?: Record<string, unknown>) => string;

const isPermissionLevel = (id: string): id is TAgentPermissionLevel =>
  (AGENT_PERMISSION_LEVELS as readonly string[]).includes(id);

/** Our adapters' modes are translated; any other agent's modes keep the names it sent. */
export function modeName(t: TTranslate, mode: Pick<SessionMode, "id" | "name">): string {
  return isPermissionLevel(mode.id) ? t(`agents.permission.levels.${mode.id}.name`) : mode.name;
}

export function modeDescription(t: TTranslate, mode: Pick<SessionMode, "id" | "description">): string | undefined {
  return isPermissionLevel(mode.id)
    ? t(`agents.permission.levels.${mode.id}.description`)
    : (mode.description ?? undefined);
}

/** i18n key for why the chat socket closed. */
export function closeReasonKey(close: CloseInfo): `agents.close.reasons.${AgentCloseReason}` {
  return `agents.close.reasons.${describeClose(close.code).reason}`;
}

/** The message for a failed chat action. */
export function chatErrorMessage(t: TTranslate, error: TAgentChatError, modeLabel?: string): string {
  if (error.kind === "mode_not_allowed")
    return t("agents.errors.mode_not_allowed", { mode: modeLabel ?? error.modeId });
  return t(`agents.errors.actions.${error.action}`);
}

/** Detail shown under the error message: the agent's own text for JSON-RPC errors. */
export function chatErrorDetail(error: TAgentChatError): string | undefined {
  if (error.kind === "request" || error.kind === "unknown") return error.message || undefined;
  return undefined;
}

const PERMISSION_OPTION_KEYS: Record<string, string> = {
  allow_once: "agents.permission_prompt.allow_once",
  allow_always: "agents.permission_prompt.allow_always",
  reject_once: "agents.permission_prompt.reject_once",
  reject_always: "agents.permission_prompt.reject_always",
};

/** Our labels for the standard option kinds; the agent's own name otherwise. */
export function permissionOptionLabel(t: TTranslate, option: PermissionOption): string {
  const key = PERMISSION_OPTION_KEYS[option.kind];
  return key ? t(key) : option.name;
}

/** Pretty JSON for tool inputs and outputs, cut to a readable size. */
export function formatJson(value: unknown, maxLength = 4000): string {
  if (value === undefined) return "";
  let text: string;
  if (typeof value === "string") text = value;
  else {
    try {
      text = JSON.stringify(value, null, 2) ?? "";
    } catch {
      text = String(value);
    }
  }
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

const LAST_AGENT_KEY = "agent_chat_last_agent";

/** The agent a member last chatted with in a workspace (per browser). */
export function recallAgent(workspaceSlug: string): string | null {
  try {
    return localStorage.getItem(`${LAST_AGENT_KEY}:${workspaceSlug}`);
  } catch {
    return null;
  }
}

export function rememberAgent(workspaceSlug: string, agentId: string): void {
  try {
    localStorage.setItem(`${LAST_AGENT_KEY}:${workspaceSlug}`, agentId);
  } catch {
    // Storage unavailable (private mode, blocked): the picker still works for this visit.
  }
}

/**
 * Stable React keys for lists whose items have no ids (plan entries, attachments, tool content):
 * the item's own text, with a counter for repeats. Keys survive appends and in-place updates.
 */
export function keyedByContent<T>(items: readonly T[], text: (item: T) => string): { key: string; item: T }[] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const value = text(item);
    const count = seen.get(value) ?? 0;
    seen.set(value, count + 1);
    return { key: count === 0 ? value : `${value}#${count}`, item };
  });
}
