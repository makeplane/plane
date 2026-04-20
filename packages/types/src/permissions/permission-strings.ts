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

import { PERMISSION_CONDITIONS_BY_PERMISSION } from "./conditions";
import type {
  PermissionResource,
  TEAMSPACE_PERMISSION_RESOURCE_ACTIONS,
  PROJECT_PERMISSION_RESOURCE_ACTIONS,
  WORKSPACE_PERMISSION_RESOURCE_ACTIONS,
  ProjectPermissionResource,
  TeamspacePermissionResource,
  WorkspacePermissionResource,
} from "./resource-actions";

/**
 * Exact workspace permission strings in the form `resource:action`.
 */
export type WorkspacePermissionString = {
  [R in WorkspacePermissionResource]: `${R}:${(typeof WORKSPACE_PERMISSION_RESOURCE_ACTIONS)[R][number]}`;
}[WorkspacePermissionResource];

/**
 * Exact teamspace permission strings in the form `resource:action`.
 */
export type TeamspacePermissionString = {
  [R in TeamspacePermissionResource]: `${R}:${(typeof TEAMSPACE_PERMISSION_RESOURCE_ACTIONS)[R][number]}`;
}[TeamspacePermissionResource];

/**
 * Exact project permission strings in the form `resource:action`.
 */
export type ProjectPermissionString = {
  [R in ProjectPermissionResource]: `${R}:${(typeof PROJECT_PERMISSION_RESOURCE_ACTIONS)[R][number]}`;
}[ProjectPermissionResource];

/**
 * Union of all non-wildcard, non-conditional permission strings.
 */
export type PermissionString = WorkspacePermissionString | TeamspacePermissionString | ProjectPermissionString;

/**
 * Generates all ordered condition suffix combinations for conditional grants.
 *
 * Example for `"creator" | "lead"`:
 * `+creator`, `+lead`, `+creator+lead`, `+lead+creator`.
 */
type ConditionSuffix<T extends string, U extends string = T> = [T] extends [never]
  ? never
  : U extends U
    ? `+${U}` | `+${U}${ConditionSuffix<Exclude<T, U>>}`
    : never;

type PermissionStringWithConditions = {
  [P in keyof typeof PERMISSION_CONDITIONS_BY_PERMISSION]: `${P & string}${ConditionSuffix<
    (typeof PERMISSION_CONDITIONS_BY_PERMISSION)[P][number]
  >}`;
}[keyof typeof PERMISSION_CONDITIONS_BY_PERMISSION];

/**
 * All valid permission grant strings.
 *
 * Includes:
 * - exact grants: `workitem:view`
 * - conditional grants: `workitem:edit+creator`
 * - resource wildcards: `workitem:*`
 * - global wildcard: `*`
 */
export type PermissionGrantString = PermissionString | PermissionStringWithConditions | `${PermissionResource}:*` | "*";
