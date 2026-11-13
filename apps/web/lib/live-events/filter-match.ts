/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * evaluates a list's rich filter on one work item, so a filtered list (or a saved view) can add or
 * remove a work item after a live event without refetching the whole list.
 *
 * The filter is the stored (external) form the server receives: a condition `{ "<property>__<operator>":
 * "<v1>,<v2>" }` or `{ and: [ ...conditions or groups ] }`. The matching mirrors IssueFilterSet in
 * apps/api/plane/utils/filters/filterset.py:
 *
 * - state_id, project_id, cycle_id, created_by_id, priority, state_group: the work item's single value
 *   equals the value (exact) or is one of the values (in);
 * - assignee_id, label_id, module_id: the work item has the value (exact) or any of the values (in);
 * - start_date, target_date: the date equals the value (exact), or lies in the inclusive range "from,to".
 *
 * Everything else cannot be evaluated here and makes the whole filter unsupported, so the caller keeps the
 * full refetch: mention_id and subscriber_id (the work item payload does not carry them), created_at and
 * updated_at (the server compares the date in the user's profile timezone), and any unknown key, operator or
 * shape.
 */

import type { TIssue } from "@plane/types";

export type TFilterMatcher = (issue: TIssue) => boolean;

type TCondition = { property: string; operator: string; values: string[] };

const lower = (value: string | null | undefined) => (value ?? "").toLowerCase();

/** Flattens the AND tree into its conditions; null when the shape is not one this module understands. */
const parseConditions = (expression: unknown): TCondition[] | null => {
  if (typeof expression !== "object" || expression === null || Array.isArray(expression)) return null;
  const node = expression as Record<string, unknown>;
  const keys = Object.keys(node);
  if (keys.length === 0) return [];
  if (keys.length === 1 && keys[0] === "and") {
    const children = node.and;
    if (!Array.isArray(children)) return null;
    const conditions: TCondition[] = [];
    for (const child of children) {
      const parsed = parseConditions(child);
      if (parsed === null) return null;
      conditions.push(...parsed);
    }
    return conditions;
  }
  if (keys.length !== 1) return null;
  const key = keys[0];
  const split = key.lastIndexOf("__");
  if (split <= 0) return null;
  const raw = node[key];
  if (typeof raw !== "string" && typeof raw !== "number" && typeof raw !== "boolean") return null;
  const values = String(raw)
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  if (values.length === 0) return null;
  return [{ property: key.slice(0, split), operator: key.slice(split + 2), values }];
};

/** The work item's values for an id-like property, lower-cased; undefined when the property is unsupported. */
const valuesOf = (
  issue: TIssue,
  property: string,
  getStateGroup: (stateId: string) => string | undefined
): string[] | undefined => {
  switch (property) {
    case "state_id":
      return [lower(issue.state_id)];
    case "project_id":
      return [lower(issue.project_id)];
    case "cycle_id":
      return [lower(issue.cycle_id)];
    case "created_by_id":
      return [lower(issue.created_by)];
    case "priority":
      return [lower(issue.priority)];
    case "state_group":
      return [lower((issue.state_id ? getStateGroup(issue.state_id) : undefined) ?? issue.state__group)];
    case "assignee_id":
      return (issue.assignee_ids ?? []).map(lower);
    case "label_id":
      return (issue.label_ids ?? []).map(lower);
    case "module_id":
      return (issue.module_ids ?? []).map(lower);
    default:
      return undefined;
  }
};

const ID_PROPERTIES = new Set([
  "state_id",
  "project_id",
  "cycle_id",
  "created_by_id",
  "priority",
  "state_group",
  "assignee_id",
  "label_id",
  "module_id",
]);
const DATE_PROPERTIES = new Set(["start_date", "target_date"]);
const DATE_VALUE = /^\d{4}-\d{2}-\d{2}$/;

/** One condition as a predicate; undefined when it cannot be evaluated on the client. */
const compileCondition = (
  condition: TCondition,
  getStateGroup: (stateId: string) => string | undefined
): TFilterMatcher | undefined => {
  const { property, operator, values } = condition;

  if (DATE_PROPERTIES.has(property)) {
    if (!values.every((value) => DATE_VALUE.test(value))) return undefined;
    const dateOf = (issue: TIssue) => {
      const value = property === "start_date" ? issue.start_date : issue.target_date;
      return value ? value.slice(0, 10) : undefined;
    };
    if (operator === "exact" && values.length === 1) return (issue) => dateOf(issue) === values[0];
    if (operator === "range" && values.length === 2) {
      const [from, to] = values;
      return (issue) => {
        const date = dateOf(issue);
        return !!date && date >= from && date <= to;
      };
    }
    return undefined;
  }

  if (!ID_PROPERTIES.has(property)) return undefined;
  const wanted = values.map((value) => value.toLowerCase());
  if (operator === "exact" && wanted.length === 1)
    return (issue) => (valuesOf(issue, property, getStateGroup) ?? []).includes(wanted[0]);
  if (operator === "in")
    return (issue) => {
      const own = valuesOf(issue, property, getStateGroup) ?? [];
      return wanted.some((value) => own.includes(value));
    };
  return undefined;
};

/**
 * The filter as a predicate on a work item, or undefined when any part of it cannot be evaluated on the
 * client (the caller then keeps the full refetch).
 */
export const compileFilter = (
  expression: unknown,
  getStateGroup: (stateId: string) => string | undefined
): TFilterMatcher | undefined => {
  const conditions = parseConditions(expression);
  if (conditions === null) return undefined;
  const matchers: TFilterMatcher[] = [];
  for (const condition of conditions) {
    const matcher = compileCondition(condition, getStateGroup);
    if (!matcher) return undefined;
    matchers.push(matcher);
  }
  return (issue) => matchers.every((matcher) => matcher(issue));
};
