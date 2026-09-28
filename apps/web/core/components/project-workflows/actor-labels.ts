/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TWorkflowFlowActorType } from "@plane/types";

/**
 * §12 — actor resolvers.
 *
 * `ALL_PROJECT_MEMBERS`, `STATIC_USERS` and `PROJECT_ROLE` ship in P0; the
 * other four return `[]` from the resolver until P1.3 plugs in the dynamic
 * providers, so they are not offered in the picker — configuring one would
 * only produce `WORKFLOW_APPROVER_NOT_RESOLVED` at transition time.
 */
export const AVAILABLE_WORKFLOW_ACTOR_TYPES: TWorkflowFlowActorType[] = [
  "ALL_PROJECT_MEMBERS",
  "STATIC_USERS",
  "PROJECT_ROLE",
];

/** Human label per actor type. Static strings: they name backend enums. */
export const getActorTypeLabel = (actorType: TWorkflowFlowActorType): string => {
  switch (actorType) {
    case "ALL_PROJECT_MEMBERS":
      return "All project members";
    case "STATIC_USERS":
      return "Specific members";
    case "PROJECT_ROLE":
      return "Project role";
    case "REQUESTER_MANAGER":
      return "Requester's manager";
    case "DEPARTMENT_HEAD":
      return "Department head";
    case "PORTAL_ROLE":
      return "Portal role";
    case "PROPERTY_MEMBER":
      return "Property member";
    default:
      return actorType;
  }
};

/**
 * Build the `config` object `services/workflow/actors.py` reads. It is the
 * only place config is interpreted, so the shape is fixed:
 *
 * - `STATIC_USERS` → `{ user_ids: [...] }`
 * - `PROJECT_ROLE` → `{ roles: [...] }` (integer role values)
 * - `ALL_PROJECT_MEMBERS` → ignored
 */
export const buildActorConfig = (
  actorType: TWorkflowFlowActorType,
  options: { userIds?: string[]; roles?: number[] } = {}
): Record<string, unknown> => {
  switch (actorType) {
    case "STATIC_USERS":
      return { user_ids: options.userIds ?? [] };
    case "PROJECT_ROLE":
      return { roles: options.roles ?? [] };
    default:
      return {};
  }
};

/** Compact one-line summary of an actor, for the §23.2 "By:" row. */
export const getActorSummary = (
  actorType: TWorkflowFlowActorType,
  config: Record<string, unknown> | undefined
): string => {
  const label = getActorTypeLabel(actorType);
  if (actorType === "STATIC_USERS") {
    const count = Array.isArray(config?.user_ids) ? config.user_ids.length : 0;
    return count === 0 ? label : `${label} (${count})`;
  }
  if (actorType === "PROJECT_ROLE") {
    const count = Array.isArray(config?.roles) ? config.roles.length : 0;
    return count === 0 ? label : `${label} (${count})`;
  }
  return label;
};
