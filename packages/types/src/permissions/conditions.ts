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

import type { PermissionString } from "./permission-strings";

export const PERMISSION_CONDITION_VALUES = {
  CREATOR: "creator",
  LEAD: "lead",
} as const;

export type PermissionCondition = (typeof PERMISSION_CONDITION_VALUES)[keyof typeof PERMISSION_CONDITION_VALUES];
/**
 * Runtime truth table used while evaluating conditional grants, for example:
 * `{ creator: true }` for "current user created this workitem".
 */
export type PermissionConditionContext = Partial<Record<PermissionCondition, boolean>>;

/**
 * Declares which conditions are applicable to each specific `resource:action` pair.
 * Only actions listed here can have conditional grants.
 * Applies across workspace, project, and teamspace-scoped resources.
 *
 * To add a condition to an action, update this map. TypeScript then enforces
 * correctness in permission strings, `can()` arguments, and condition contexts.
 */
export const PERMISSION_CONDITIONS_BY_PERMISSION = {
  // -- workspace_workitem_view -------------------------------------------------
  "workspace_workitem_view:edit": ["creator"],
  "workspace_workitem_view:delete": ["creator"],
  // -- initiative_comment ------------------------------------------------------
  "initiative_comment:edit": ["creator"],
  "initiative_comment:delete": ["creator"],
  // -- initiative_attachment ---------------------------------------------------
  "initiative_attachment:delete": ["creator"],
  // -- workspace_draft ---------------------------------------------------------
  "workspace_draft:delete": ["creator"],
  // -- teamspace (lead-scoped checks) -----------------------------------------
  "teamspace:edit": ["lead"],
  "teamspace:delete": ["lead"],
  "teamspace:manage": ["lead"],
  // -- teamspace_comment -------------------------------------------------------
  "teamspace_comment:edit": ["creator"],
  "teamspace_comment:delete": ["creator"],
  // -- teamspace_workitem_view ------------------------------------------------
  "teamspace_workitem_view:edit": ["creator"],
  "teamspace_workitem_view:delete": ["creator"],
  // -- comment -----------------------------------------------------------------
  "comment:edit": ["creator"],
  "comment:delete": ["creator"],
  // -- workitem ----------------------------------------------------------------
  "workitem:edit": ["creator"],
  "workitem:delete": ["creator"],
  "workitem:view": ["creator"],
  // -- epic --------------------------------------------------------------------
  "epic:delete": ["creator"],
  // -- epic_update -------------------------------------------------------------
  "epic_update:edit": ["creator"],
  "epic_update:delete": ["creator"],
  // -- epic_update_comment -----------------------------------------------------
  "epic_update_comment:edit": ["creator"],
  "epic_update_comment:delete": ["creator"],
  // -- project_update ----------------------------------------------------------
  "project_update:edit": ["creator"],
  "project_update:delete": ["creator"],
  // -- project_update_comment --------------------------------------------------
  "project_update_comment:edit": ["creator"],
  "project_update_comment:delete": ["creator"],
  // -- module ------------------------------------------------------------------
  "module:delete": ["creator"],
  // -- cycle -------------------------------------------------------------------
  "cycle:delete": ["creator"],
  // -- cycle_update ------------------------------------------------------------
  "cycle_update:edit": ["creator"],
  "cycle_update:delete": ["creator"],
  // -- workitem_view -----------------------------------------------------------
  "workitem_view:edit": ["creator"],
  "workitem_view:share": ["creator"],
  "workitem_view:publish": ["creator"],
  "workitem_view:delete": ["creator"],
  // -- intake ------------------------------------------------------------------
  "intake:edit": ["creator"],
  "intake:delete": ["creator"],
  "intake:view": ["creator"],
  // -- attachment --------------------------------------------------------------
  "attachment:edit": ["creator"],
  "attachment:delete": ["creator"],
  // -- project_asset -----------------------------------------------------------
  "project_asset:edit": ["creator"],
  "project_asset:delete": ["creator"],
} as const satisfies Partial<Record<PermissionString, readonly PermissionCondition[]>>;

type PermissionConditionMap = typeof PERMISSION_CONDITIONS_BY_PERMISSION;

/**
 * Condition union applicable to a specific permission string.
 *
 * Example:
 * `PermissionConditionsForString<"intake:edit">` -> `"creator"`.
 */
export type PermissionConditionsForString<P extends PermissionString> = P extends keyof PermissionConditionMap
  ? PermissionConditionMap[P][number]
  : never;

/**
 * Minimal required condition context for a specific permission string.
 *
 * Example:
 * `PermissionConditionContextForString<"teamspace:manage">` -> `{ lead: boolean }`.
 */
export type PermissionConditionContextForString<P extends PermissionString> = [
  PermissionConditionsForString<P>,
] extends [never]
  ? never
  : Record<PermissionConditionsForString<P>, boolean>;
