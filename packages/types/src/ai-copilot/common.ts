/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Page or work item a copilot session is attached to.
export type TCopilotEntityType = "page" | "issue";

export type TCopilotMessageRole = "user" | "assistant";

export type TCopilotEventName = "message_delta" | "tool_call_start" | "tool_call_update" | "tool_call_end";

export type TToolName = "ask_user" | "search_tickets" | "propose_edit" | "draft_tickets" | "remember" | "web_search";

export type TToolStatus = "running" | "done" | "failed";

export type TToolErrorCode = "cancelled" | "stale_proposal" | "validation_error" | "upstream_error" | "internal_error";

export type TToolError = {
  code: TToolErrorCode;
  message: string;
};

export type THunkDecision = "accepted" | "rejected";
