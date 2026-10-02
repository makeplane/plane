/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssuePriorities } from "../issues";
import type { TAskUserArgs, TAskUserResponseData, TAskUserResult } from "./ask-user";
import type { THunkDecision, TToolError, TToolName } from "./common";

// search_tickets

export type TTicketSummary = {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string;
  project_identifier: string;
  priority: TIssuePriorities;
};

export type TSearchTicketsArgs = {
  query: string;
  limit?: number;
};

// While running, updates carry the results found so far, and `selected_ticket_ids` is filled when the call ends.
export type TSearchTicketsResult = {
  query: string;
  tickets: TTicketSummary[];
  selected_ticket_ids: string[];
};

// propose_edit

export type TProposeEditHunk = {
  id: string;
  // Zero-based line index of the hunk in the base content.
  old_start_line: number;
  old_text: string;
  new_text: string;
};

export type TProposeEditArgs = {
  title?: string;
  // Identifies the content the hunks were computed against. A mismatch at apply time makes the proposal stale.
  base_fingerprint: string;
  hunks: TProposeEditHunk[];
};

export type TProposeEditResponseData = {
  decisions: Record<string, THunkDecision>;
};

export type TProposeEditResult = {
  decisions: Record<string, THunkDecision>;
  applied: boolean;
};

// draft_tickets

export type TDraftTicket = {
  id: string;
  title: string;
  description: string;
  priority: TIssuePriorities;
};

export type TDraftTicketsArgs = {
  drafts: TDraftTicket[];
};

// The drafts the user chose to create, after edits. Removed drafts are left out.
export type TDraftTicketsResponseData = {
  drafts: TDraftTicket[];
};

export type TCreatedTicket = {
  draft_id: string;
  issue_id: string;
  sequence_id: number;
  project_identifier: string;
};

export type TDraftTicketsResult = {
  created: TCreatedTicket[];
  failed: { draft_id: string; error: TToolError }[];
};

// remember

export type TRememberArgs = {
  content: string;
};

export type TRememberResult = {
  memory_id: string;
  content: string;
  // Set when the user deletes the memory after it was created.
  deleted: boolean;
};

// web_search

export type TWebSearchSource = {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
};

// Marks the character range [start, end) of `answer` that is supported by the listed sources.
export type TWebSearchCitation = {
  start: number;
  end: number;
  source_ids: string[];
};

export type TWebSearchArgs = {
  queries: string[];
};

export type TWebSearchResult = {
  queries: string[];
  sources: TWebSearchSource[];
  answer: string;
  citations: TWebSearchCitation[];
};

// Per-tool maps. The helper makes the compiler reject a map that misses a tool.

type TToolMap<T extends Record<TToolName, unknown>> = T;

export type TToolArgsMap = TToolMap<{
  ask_user: TAskUserArgs;
  search_tickets: TSearchTicketsArgs;
  propose_edit: TProposeEditArgs;
  draft_tickets: TDraftTicketsArgs;
  remember: TRememberArgs;
  web_search: TWebSearchArgs;
}>;

export type TToolResultMap = TToolMap<{
  ask_user: TAskUserResult;
  search_tickets: TSearchTicketsResult;
  propose_edit: TProposeEditResult;
  draft_tickets: TDraftTicketsResult;
  remember: TRememberResult;
  web_search: TWebSearchResult;
}>;

// Tools that wait for the user. The other tools run to completion on their own.
export type TToolResponseDataMap = {
  ask_user: TAskUserResponseData;
  propose_edit: TProposeEditResponseData;
  draft_tickets: TDraftTicketsResponseData;
};

export type TInteractiveToolName = keyof TToolResponseDataMap;
