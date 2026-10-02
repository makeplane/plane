/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type {
  TAskUserQuestionType,
  TCopilotEntityType,
  TCopilotEventName,
  TCopilotMessageRole,
  THunkDecision,
  TInteractiveToolName,
  TToolErrorCode,
  TToolName,
  TToolStatus,
} from "@plane/types";

// Each map must list every member of its union, so adding a value to a type fails the build until it is added here.

export const COPILOT_EVENT_NAMES = {
  message_delta: "message_delta",
  tool_call_start: "tool_call_start",
  tool_call_update: "tool_call_update",
  tool_call_end: "tool_call_end",
} as const satisfies { [K in TCopilotEventName]: K };

export const COPILOT_TOOL_NAMES = {
  ask_user: "ask_user",
  search_tickets: "search_tickets",
  propose_edit: "propose_edit",
  draft_tickets: "draft_tickets",
  remember: "remember",
  web_search: "web_search",
} as const satisfies { [K in TToolName]: K };

export const COPILOT_TOOL_STATUSES = {
  running: "running",
  done: "done",
  failed: "failed",
} as const satisfies { [K in TToolStatus]: K };

export const COPILOT_ENTITY_TYPES = {
  page: "page",
  issue: "issue",
} as const satisfies { [K in TCopilotEntityType]: K };

export const COPILOT_MESSAGE_ROLES = {
  user: "user",
  assistant: "assistant",
} as const satisfies { [K in TCopilotMessageRole]: K };

export const COPILOT_HUNK_DECISIONS = {
  accepted: "accepted",
  rejected: "rejected",
} as const satisfies { [K in THunkDecision]: K };

export const COPILOT_TOOL_ERROR_CODES = {
  cancelled: "cancelled",
  stale_proposal: "stale_proposal",
  validation_error: "validation_error",
  upstream_error: "upstream_error",
  internal_error: "internal_error",
} as const satisfies { [K in TToolErrorCode]: K };

export const COPILOT_ASK_USER_QUESTION_TYPES = {
  short_text: "short_text",
  long_text: "long_text",
  dropdown: "dropdown",
  multi_select: "multi_select",
  yes_no: "yes_no",
  number: "number",
  date: "date",
  ticket_picker: "ticket_picker",
  file_picker: "file_picker",
} as const satisfies { [K in TAskUserQuestionType]: K };

// Tools that wait for a user response.
export const COPILOT_INTERACTIVE_TOOL_NAMES = [
  COPILOT_TOOL_NAMES.ask_user,
  COPILOT_TOOL_NAMES.propose_edit,
  COPILOT_TOOL_NAMES.draft_tickets,
] as const satisfies readonly TInteractiveToolName[];

// A tool call in one of these statuses will not change again unless it is retried.
export const COPILOT_TERMINAL_TOOL_STATUSES = [
  COPILOT_TOOL_STATUSES.done,
  COPILOT_TOOL_STATUSES.failed,
] as const satisfies readonly TToolStatus[];

// URL paths relative to the API base URL. The Django routes must keep the same shape.
const copilotSessionsPath = (workspaceSlug: string, projectId: string) =>
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/copilot/sessions/`;

const copilotSessionPath = (workspaceSlug: string, projectId: string, sessionId: string) =>
  `${copilotSessionsPath(workspaceSlug, projectId)}${sessionId}/`;

export const COPILOT_ENDPOINTS = {
  // POST get-or-create by entity
  sessions: copilotSessionsPath,
  // GET session with its transcript
  session: copilotSessionPath,
  // GET text/event-stream
  stream: (workspaceSlug: string, projectId: string, sessionId: string) =>
    `${copilotSessionPath(workspaceSlug, projectId, sessionId)}stream/`,
  // POST user message
  messages: (workspaceSlug: string, projectId: string, sessionId: string) =>
    `${copilotSessionPath(workspaceSlug, projectId, sessionId)}messages/`,
  // POST stop the running turn
  stop: (workspaceSlug: string, projectId: string, sessionId: string) =>
    `${copilotSessionPath(workspaceSlug, projectId, sessionId)}stop/`,
  // POST tool response `{ tool_call_id, data }`
  responses: (workspaceSlug: string, projectId: string, sessionId: string) =>
    `${copilotSessionPath(workspaceSlug, projectId, sessionId)}responses/`,
  // POST retry a failed tool call `{ tool_call_id }`
  retry: (workspaceSlug: string, projectId: string, sessionId: string) =>
    `${copilotSessionPath(workspaceSlug, projectId, sessionId)}retry/`,
  // GET list
  memories: (workspaceSlug: string, projectId: string, sessionId: string) =>
    `${copilotSessionPath(workspaceSlug, projectId, sessionId)}memories/`,
  // PATCH and DELETE
  memory: (workspaceSlug: string, projectId: string, sessionId: string, memoryId: string) =>
    `${copilotSessionPath(workspaceSlug, projectId, sessionId)}memories/${memoryId}/`,
};
