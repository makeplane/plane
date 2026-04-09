/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { TokenKind } from "../types";

// ─── Field aliases: internal filter property key → PQL field name ─────────────
// Mirrors the Python FIELD_ALIASES constant in apps/api/plane/utils/pql/constants.py.
// The PQL uses these camelCase aliases; the backend maps them back to the internal
// ORM keys (state_id, assignee_id, …) before querying.

export const FIELD_ALIASES: Record<string, string> = {
  // Direct fields
  priority: "priority",
  is_draft: "isDraft",
  is_archived: "isArchived",
  // UUID relation fields
  state_id: "state",
  assignee_id: "assignee",
  label_id: "label",
  cycle_id: "cycle",
  module_id: "module",
  mention_id: "mention",
  subscriber_id: "subscriber",
  project_id: "project",
  created_by_id: "createdBy",
  type_id: "type",
  milestone_id: "milestone",
  team_project_id: "teamspaceProject",
  state_group: "stateGroup",
  // Date fields
  start_date: "startDate",
  target_date: "dueDate",
  created_at: "createdAt",
  updated_at: "updatedAt",
  // Text search fields
  name: "title",
  text: "text",
};

/** PQL field names that expect date / datetime string values (yyyy-M-d). */
export const DATE_FIELD_NAMES = new Set<string>([
  FIELD_ALIASES.start_date,
  FIELD_ALIASES.target_date,
  FIELD_ALIASES.created_at,
  FIELD_ALIASES.updated_at,
]);

// ─── Valid history field names (for wasEver, changedFrom, etc.) ───────────────

export const HISTORY_FIELD_NAMES = new Set([
  "state",
  "stateGroup",
  "priority",
  "assignee",
  "label",
  "name",
  "description",
  "parent",
  "startDate",
  "targetDate",
  "cycle",
  "module",
  "milestone",
  "estimate",
  "type",
]);

// ─── Function definitions ─────────────────────────────────────────────────────

export type FunctionKind =
  | "PREDICATE" // standalone boolean condition, no field/op needed
  | "DATE" // returns a date value
  | "USER" // returns a user UUID (or list)
  | "CYCLE" // returns a list of cycle UUIDs
  | "STATE" // returns a list of state group strings
  | "RELATION" // standalone condition, takes an issue UUID arg
  | "HISTORY"; // standalone condition, takes field/value/date args

export type FunctionDef = {
  name: string;
  i18n_description: string;
  kind: FunctionKind;
  minArity: number;
  maxArity: number;
  /** If true, the function can appear on the RHS of an IN operator */
  returnsList: boolean;
  /** If true, the function can ONLY be used as a standalone condition, not as a value */
  isStandalone: boolean;
  /** Human-readable signature for the autocomplete detail */
  signature: string;
};

export const FUNCTION_DEFS: FunctionDef[] = [
  // ── Date functions ─────────────────────────────────────────────────────────
  {
    name: "now",
    i18n_description: "pql.functions.date.now.description",
    kind: "DATE",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: false,
    signature: "now()",
  },
  {
    name: "today",
    i18n_description: "pql.functions.date.today.description",
    kind: "DATE",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: false,
    signature: "today()",
  },
  {
    name: "startOfDay",
    i18n_description: "pql.functions.date.start_of_day.description",
    kind: "DATE",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: false,
    signature: "startOfDay()",
  },
  {
    name: "endOfDay",
    i18n_description: "pql.functions.date.end_of_day.description",
    kind: "DATE",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: false,
    signature: "endOfDay()",
  },
  {
    name: "startOfWeek",
    i18n_description: "pql.functions.date.start_of_week.description",
    kind: "DATE",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: false,
    signature: "startOfWeek()",
  },
  {
    name: "endOfWeek",
    i18n_description: "pql.functions.date.end_of_week.description",
    kind: "DATE",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: false,
    signature: "endOfWeek()",
  },
  {
    name: "startOfMonth",
    kind: "DATE",
    i18n_description: "pql.functions.date.start_of_month.description",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: false,
    signature: "startOfMonth()",
  },
  {
    name: "endOfMonth",
    kind: "DATE",
    i18n_description: "pql.functions.date.end_of_month.description",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: false,
    signature: "endOfMonth()",
  },
  {
    name: "startOfYear",
    kind: "DATE",
    i18n_description: "pql.functions.date.start_of_year.description",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: false,
    signature: "startOfYear()",
  },
  {
    name: "endOfYear",
    kind: "DATE",
    i18n_description: "pql.functions.date.end_of_year.description",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: false,
    signature: "endOfYear()",
  },
  {
    name: "daysAgo",
    i18n_description: "pql.functions.date.days_ago.description",
    kind: "DATE",
    minArity: 1,
    maxArity: 1,
    returnsList: false,
    isStandalone: false,
    signature: "daysAgo(n)",
  },
  {
    name: "daysFromNow",
    i18n_description: "pql.functions.date.days_from_now.description",
    kind: "DATE",
    minArity: 1,
    maxArity: 1,
    returnsList: false,
    isStandalone: false,
    signature: "daysFromNow(n)",
  },
  {
    name: "weeksAgo",
    i18n_description: "pql.functions.date.weeks_ago.description",
    kind: "DATE",
    minArity: 1,
    maxArity: 1,
    returnsList: false,
    isStandalone: false,
    signature: "weeksAgo(n)",
  },
  {
    name: "weeksFromNow",
    i18n_description: "pql.functions.date.weeks_from_now.description",
    kind: "DATE",
    minArity: 1,
    maxArity: 1,
    returnsList: false,
    isStandalone: false,
    signature: "weeksFromNow(n)",
  },
  {
    name: "monthsAgo",
    i18n_description: "pql.functions.date.months_ago.description",
    kind: "DATE",
    minArity: 1,
    maxArity: 1,
    returnsList: false,
    isStandalone: false,
    signature: "monthsAgo(n)",
  },
  {
    name: "monthsFromNow",
    i18n_description: "pql.functions.date.months_from_now.description",
    kind: "DATE",
    minArity: 1,
    maxArity: 1,
    returnsList: false,
    isStandalone: false,
    signature: "monthsFromNow(n)",
  },
  // ── User functions ─────────────────────────────────────────────────────────
  {
    name: "currentUser",
    i18n_description: "pql.functions.user.current_user.description",
    kind: "USER",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: false,
    signature: "currentUser()",
  },
  // {
  //   name: "membersOf",
  //   i18n_description: "pql.functions.user.members_of.description",
  //   kind: "USER",
  //   minArity: 1,
  //   maxArity: 1,
  //   returnsList: true,
  //   isStandalone: false,
  //   signature: 'membersOf("project:<id>")',
  // },
  // ── Cycle functions ────────────────────────────────────────────────────────
  {
    name: "activeCycle",
    i18n_description: "pql.functions.cycle.active_cycle.description",
    kind: "CYCLE",
    minArity: 0,
    maxArity: 0,
    returnsList: true,
    isStandalone: false,
    signature: "activeCycle()",
  },
  {
    name: "completedCycles",
    i18n_description: "pql.functions.cycle.completed_cycles.description",
    kind: "CYCLE",
    minArity: 0,
    maxArity: 0,
    returnsList: true,
    isStandalone: false,
    signature: "completedCycles()",
  },
  {
    name: "upcomingCycles",
    i18n_description: "pql.functions.cycle.upcoming_cycles.description",
    kind: "CYCLE",
    minArity: 0,
    maxArity: 0,
    returnsList: true,
    isStandalone: false,
    signature: "upcomingCycles()",
  },
  // ── State functions ────────────────────────────────────────────────────────
  {
    name: "openStates",
    i18n_description: "pql.functions.state.open_states.description",
    kind: "STATE",
    minArity: 0,
    maxArity: 0,
    returnsList: true,
    isStandalone: false,
    signature: "openStates()",
  },
  {
    name: "closedStates",
    i18n_description: "pql.functions.state.closed_states.description",
    kind: "STATE",
    minArity: 0,
    maxArity: 0,
    returnsList: true,
    isStandalone: false,
    signature: "closedStates()",
  },
  {
    name: "activeStates",
    i18n_description: "pql.functions.state.active_states.description",
    kind: "STATE",
    minArity: 0,
    maxArity: 0,
    returnsList: true,
    isStandalone: false,
    signature: "activeStates()",
  },
  // ── Predicate functions ────────────────────────────────────────────────────
  {
    name: "isOverdue",
    i18n_description: "pql.functions.predicate.is_overdue.description",
    kind: "PREDICATE",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: true,
    signature: "isOverdue()",
  },
  {
    name: "hasNoAssignee",
    i18n_description: "pql.functions.predicate.has_no_assignee.description",
    kind: "PREDICATE",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: true,
    signature: "hasNoAssignee()",
  },
  {
    name: "hasNoLabel",
    i18n_description: "pql.functions.predicate.has_no_label.description",
    kind: "PREDICATE",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: true,
    signature: "hasNoLabel()",
  },
  {
    name: "isTopLevel",
    i18n_description: "pql.functions.predicate.is_top_level.description",
    kind: "PREDICATE",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: true,
    signature: "isTopLevel()",
  },
  {
    name: "isSubWorkItem",
    i18n_description: "pql.functions.predicate.is_sub_work_item.description",
    kind: "PREDICATE",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: true,
    signature: "isSubWorkItem()",
  },
  // {
  //   name: "isEpic",
  //   i18n_description: "pql.functions.predicate.is_epic.description",
  //   kind: "PREDICATE",
  //   minArity: 0,
  //   maxArity: 0,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: "isEpic()",
  // },
  // {
  //   name: "isIntake",
  //   i18n_description: "pql.functions.predicate.is_intake.description",
  //   kind: "PREDICATE",
  //   minArity: 0,
  //   maxArity: 0,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: "isIntake()",
  // },
  // {
  //   name: "isDraft",
  //   i18n_description: "pql.functions.predicate.is_draft.description",
  //   kind: "PREDICATE",
  //   minArity: 0,
  //   maxArity: 0,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: "isDraft()",
  // },
  // {
  //   name: "isArchived",
  //   i18n_description: "pql.functions.predicate.is_archived.description",
  //   kind: "PREDICATE",
  //   minArity: 0,
  //   maxArity: 0,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: "isArchived()",
  // },
  {
    name: "hasChildren",
    i18n_description: "pql.functions.predicate.has_children.description",
    kind: "PREDICATE",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: true,
    signature: "hasChildren()",
  },
  {
    name: "hasStartAndDueDates",
    i18n_description: "pql.functions.predicate.has_start_and_due_dates.description",
    kind: "PREDICATE",
    minArity: 0,
    maxArity: 0,
    returnsList: false,
    isStandalone: true,
    signature: "hasStartAndDueDates()",
  },
  // ── Relation functions ─────────────────────────────────────────────────────
  // {
  //   name: "linkedTo",
  //   i18n_description: "pql.functions.relation.linked_to.description",
  //   kind: "RELATION",
  //   minArity: 1,
  //   maxArity: 1,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'linkedTo("<issue-uuid>")',
  // },
  // {
  //   name: "blockedBy",
  //   i18n_description: "pql.functions.relation.blocked_by.description",
  //   kind: "RELATION",
  //   minArity: 1,
  //   maxArity: 1,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'blockedBy("<issue-uuid>")',
  // },
  // {
  //   name: "blocks",
  //   i18n_description: "pql.functions.relation.blocks.description",
  //   kind: "RELATION",
  //   minArity: 1,
  //   maxArity: 1,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'blocks("<issue-uuid>")',
  // },
  // {
  //   name: "childOf",
  //   i18n_description: "pql.functions.relation.child_of.description",
  //   kind: "RELATION",
  //   minArity: 1,
  //   maxArity: 1,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'childOf("<issue-uuid>")',
  // },
  // {
  //   name: "parentOf",
  //   i18n_description: "pql.functions.relation.parent_of.description",
  //   kind: "RELATION",
  //   minArity: 1,
  //   maxArity: 1,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'parentOf("<issue-uuid>")',
  // },
  // {
  //   name: "duplicateOf",
  //   i18n_description: "pql.functions.relation.duplicate_of.description",
  //   kind: "RELATION",
  //   minArity: 1,
  //   maxArity: 1,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'duplicateOf("<issue-uuid>")',
  // },
  // ── History functions ──────────────────────────────────────────────────────
  // {
  //   name: "wasEver",
  //   i18n_description: "pql.functions.history.was_ever.description",
  //   kind: "HISTORY",
  //   minArity: 2,
  //   maxArity: 2,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'wasEver("field", value)',
  // },
  // {
  //   name: "was",
  //   i18n_description: "pql.functions.history.was.description",
  //   kind: "HISTORY",
  //   minArity: 2,
  //   maxArity: 2,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'was("field", value)',
  // },
  // {
  //   name: "changedFrom",
  //   i18n_description: "pql.functions.history.changed_from.description",
  //   kind: "HISTORY",
  //   minArity: 2,
  //   maxArity: 2,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'changedFrom("field", value)',
  // },
  // {
  //   name: "changedTo",
  //   i18n_description: "pql.functions.history.changed_to.description",
  //   kind: "HISTORY",
  //   minArity: 2,
  //   maxArity: 2,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'changedTo("field", value)',
  // },
  // {
  //   name: "changed",
  //   i18n_description: "pql.functions.history.changed.description",
  //   kind: "HISTORY",
  //   minArity: 1,
  //   maxArity: 1,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'changed("field")',
  // },
  // {
  //   name: "updatedBy",
  //   i18n_description: "pql.functions.history.updated_by.description",
  //   kind: "HISTORY",
  //   minArity: 1,
  //   maxArity: 1,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'updatedBy("<user-uuid>")',
  // },
  // {
  //   name: "commentedBy",
  //   i18n_description: "pql.functions.history.commented_by.description",
  //   kind: "HISTORY",
  //   minArity: 1,
  //   maxArity: 1,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'commentedBy("<user-uuid>")',
  // },
  // {
  //   name: "fieldChangedBy",
  //   i18n_description: "pql.functions.history.field_changed_by.description",
  //   kind: "HISTORY",
  //   minArity: 2,
  //   maxArity: 2,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'fieldChangedBy("field", "<user-uuid>")',
  // },
  // {
  //   name: "wasAssignedTo",
  //   i18n_description: "pql.functions.history.was_assigned_to.description",
  //   kind: "HISTORY",
  //   minArity: 1,
  //   maxArity: 1,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'wasAssignedTo("<user-uuid>")',
  // },
  // {
  //   name: "changedAfter",
  //   i18n_description: "pql.functions.history.changed_after.description",
  //   kind: "HISTORY",
  //   minArity: 1,
  //   maxArity: 1,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'changedAfter("<date>")',
  // },
  // {
  //   name: "changedBefore",
  //   i18n_description: "pql.functions.history.changed_before.description",
  //   kind: "HISTORY",
  //   minArity: 1,
  //   maxArity: 1,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'changedBefore("<date>")',
  // },
  // {
  //   name: "fieldChangedAfter",
  //   i18n_description: "pql.functions.history.field_changed_after.description",
  //   kind: "HISTORY",
  //   minArity: 2,
  //   maxArity: 2,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'fieldChangedAfter("field", "<date>")',
  // },
  // {
  //   name: "fieldChangedBefore",
  //   i18n_description: "pql.functions.history.field_changed_before.description",
  //   kind: "HISTORY",
  //   minArity: 2,
  //   maxArity: 2,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'fieldChangedBefore("field", "<date>")',
  // },
  // {
  //   name: "changedToAfter",
  //   i18n_description: "pql.functions.history.changed_to_after.description",
  //   kind: "HISTORY",
  //   minArity: 3,
  //   maxArity: 3,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'changedToAfter("field", value, "<date>")',
  // },
  // {
  //   name: "changedToBefore",
  //   i18n_description: "pql.functions.history.changed_to_before.description",
  //   kind: "HISTORY",
  //   minArity: 3,
  //   maxArity: 3,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'changedToBefore("field", value, "<date>")',
  // },
  // {
  //   name: "fieldChangedBetween",
  //   i18n_description: "pql.functions.history.field_changed_between.description",
  //   kind: "HISTORY",
  //   minArity: 3,
  //   maxArity: 3,
  //   returnsList: false,
  //   isStandalone: true,
  //   signature: 'fieldChangedBetween("field", "<from>", "<to>")',
  // },
];

// ─── Sortable field names for ORDER BY ───────────────────────────────────────
// Mirrors the Python ORDER_BY_ALIASES in apps/api/plane/utils/pql/constants.py.
// Only these PQL field names are valid in ORDER BY clauses.

export const SORTABLE_FIELDS = new Set<string>([
  "priority",
  "state",
  "stateGroup",
  "createdAt",
  "updatedAt",
  "startDate",
  "dueDate",
  "title",
  "assignee",
  "label",
  "module",
  "createdBy",
  "sequenceId",
  "sortOrder",
  "completedAt",
  "archivedAt",
  "isDraft",
  "type",
]);

/** Map from function name → FunctionDef */
export const FUNCTION_MAP = new Map<string, FunctionDef>(FUNCTION_DEFS.map((f) => [f.name, f]));

/** Map from function name → TokenKind */
export const FUNCTION_TOKEN_KIND = new Map<string, TokenKind>(
  FUNCTION_DEFS.map((f) => {
    const kindMap: Record<FunctionKind, TokenKind> = {
      PREDICATE: TokenKind.FN_PREDICATE,
      DATE: TokenKind.FN_DATE,
      USER: TokenKind.FN_USER,
      CYCLE: TokenKind.FN_CYCLE,
      STATE: TokenKind.FN_STATE,
      RELATION: TokenKind.FN_RELATION,
      HISTORY: TokenKind.FN_HISTORY,
    };
    return [f.name, kindMap[f.kind]];
  })
);

/** Set of list-returning function names (valid on RHS of IN) */
export const LIST_RETURNING_FUNCTIONS = new Set<string>(FUNCTION_DEFS.filter((f) => f.returnsList).map((f) => f.name));

/** Set of standalone-only function names (cannot be used as a value) */
export const STANDALONE_FUNCTIONS = new Set<string>(FUNCTION_DEFS.filter((f) => f.isStandalone).map((f) => f.name));

// ─── Keyword set ──────────────────────────────────────────────────────────────

/** Lower-cased keyword strings → their TokenKind */
export const KEYWORD_MAP = new Map<string, TokenKind>([
  ["and", TokenKind.AND],
  ["or", TokenKind.OR],
  ["not", TokenKind.NOT],
  ["in", TokenKind.IN],
  ["is", TokenKind.IS],
  ["null", TokenKind.NULL_KW],
  ["empty", TokenKind.EMPTY_KW],
  ["between", TokenKind.BETWEEN],
  ["true", TokenKind.TRUE_KW],
  ["false", TokenKind.FALSE_KW],
  // ORDER BY / LIMIT clause keywords
  ["order", TokenKind.ORDER],
  ["by", TokenKind.BY],
  ["limit", TokenKind.LIMIT],
  ["asc", TokenKind.ASC],
  ["desc", TokenKind.DESC],
]);
