/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * which work item filter conditions can be shared by every project's board.
 *
 * A rich filter expression is a single condition object ({ "<property>__<operator>": value }) or an
 * { and: [...] } group of them. It is flattened into one condition per key, and each condition is
 * classified:
 *
 *  - portable (kept in the global template): priority, state_group, start_date, target_date, created_at,
 *    updated_at; and assignee_id / created_by_id when the value is exactly the current user ("assigned to
 *    me", "created by me").
 *  - project-specific (kept per project): every other condition, including state_id, label_id, cycle_id,
 *    module_id, project_id, and member conditions (assignee_id, created_by_id, mention_id, subscriber_id)
 *    naming anyone other than exactly the current user. Any node this file does not understand (an operator
 *    other than "and") is kept per project as a whole.
 *
 * Before a board uses project-specific conditions, ids that are known not to exist in that project are
 * dropped (see sanitizeProjectConditions); a condition left without ids is dropped.
 */

import type { TWorkItemFilterExpression } from "@plane/types";

type TCondition = Record<string, unknown>;

const AND = "and";

export const PORTABLE_PROPERTIES = new Set([
  "priority",
  "state_group",
  "start_date",
  "target_date",
  "created_at",
  "updated_at",
]);
/** member properties that are portable when they name exactly the current user */
export const ME_PROPERTIES = new Set(["assignee_id", "created_by_id"]);

export type TProjectEntityIds = {
  state_id?: string[] | null;
  label_id?: string[] | null;
  cycle_id?: string[] | null;
  module_id?: string[] | null;
  /** project member ids, used for every member property */
  members?: string[] | null;
};

const MEMBER_PROPERTIES = new Set(["assignee_id", "created_by_id", "mention_id", "subscriber_id"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** "state_id__in" -> "state_id" */
export const conditionProperty = (key: string): string => {
  const index = key.lastIndexOf("__");
  return index > 0 ? key.slice(0, index) : key;
};

const splitIds = (value: unknown): string[] =>
  typeof value === "string"
    ? value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];

/** One entry per condition key; nodes that are not plain conditions or "and" groups are kept whole. */
export const flattenExpression = (expression: unknown): TCondition[] => {
  if (!isRecord(expression)) return [];
  const keys = Object.keys(expression);
  if (keys.length === 0) return [];
  if (keys.length === 1 && keys[0] === AND) {
    const children = expression[AND];
    return Array.isArray(children) ? children.flatMap((child) => flattenExpression(child)) : [];
  }
  // a node with a logical operator this file does not know: keep it whole
  if (keys.some((key) => !key.includes("__"))) return [expression];
  return keys.map((key) => ({ [key]: expression[key] }));
};

export const buildExpression = (conditions: TCondition[]): TWorkItemFilterExpression => {
  if (conditions.length === 0) return {} as TWorkItemFilterExpression;
  if (conditions.length === 1) return conditions[0] as TWorkItemFilterExpression;
  return { [AND]: conditions } as unknown as TWorkItemFilterExpression;
};

export const isPortableCondition = (condition: TCondition, currentUserId: string | undefined): boolean => {
  const keys = Object.keys(condition);
  if (keys.length !== 1 || !keys[0].includes("__")) return false;
  const property = conditionProperty(keys[0]);
  if (PORTABLE_PROPERTIES.has(property)) return true;
  if (ME_PROPERTIES.has(property) && currentUserId) {
    const ids = splitIds(condition[keys[0]]);
    return ids.length === 1 && ids[0] === currentUserId;
  }
  return false;
};

/** Splits an expression into its portable part and its project-specific part. */
export const splitExpression = (
  expression: unknown,
  currentUserId: string | undefined
): { portable: TWorkItemFilterExpression; project: TWorkItemFilterExpression } => {
  const portable: TCondition[] = [];
  const project: TCondition[] = [];
  for (const condition of flattenExpression(expression)) {
    if (isPortableCondition(condition, currentUserId)) portable.push(condition);
    else project.push(condition);
  }
  return { portable: buildExpression(portable), project: buildExpression(project) };
};

/**
 * Drops ids that are known not to exist in the project. A list that is not loaded (undefined or null) drops
 * nothing, so a board never loses a filter because its states or labels have not been fetched yet.
 */
export const sanitizeProjectConditions = (expression: unknown, known: TProjectEntityIds): TCondition[] => {
  const out: TCondition[] = [];
  for (const condition of flattenExpression(expression)) {
    const keys = Object.keys(condition);
    if (keys.length !== 1 || !keys[0].includes("__")) {
      out.push(condition);
      continue;
    }
    const key = keys[0];
    const property = conditionProperty(key);
    const list = MEMBER_PROPERTIES.has(property) ? known.members : known[property as keyof TProjectEntityIds];
    if (!list || typeof condition[key] !== "string") {
      out.push(condition);
      continue;
    }
    const allowed = new Set(list);
    const ids = splitIds(condition[key]).filter((id) => allowed.has(id));
    if (ids.length > 0) out.push({ [key]: ids.join(",") });
  }
  return out;
};

/** The board's expression while the global template is on: template conditions, then project conditions. */
export const combineExpressions = (
  templateFilters: unknown,
  projectFilters: unknown,
  known: TProjectEntityIds,
  currentUserId: string | undefined
): TWorkItemFilterExpression => {
  // the template only ever holds portable conditions; anything else in it is ignored
  const portable = flattenExpression(templateFilters).filter((c) => isPortableCondition(c, currentUserId));
  const project = sanitizeProjectConditions(splitExpression(projectFilters, currentUserId).project, known);
  return buildExpression([...portable, ...project]);
};
