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

import type { PermissionCondition, PermissionResource } from "@plane/types";
import {
  PERMISSION_CONDITION_VALUES,
  PROJECT_PERMISSION_RESOURCE_ACTIONS,
  TEAMSPACE_PERMISSION_RESOURCE_ACTIONS,
  WORKSPACE_PERMISSION_RESOURCE_ACTIONS,
} from "@plane/types";

/**
 * Validates a permission resource token against the canonical resource maps.
 */
export function isValidPermissionResource(resource: string): resource is PermissionResource {
  return (
    resource in WORKSPACE_PERMISSION_RESOURCE_ACTIONS ||
    resource in TEAMSPACE_PERMISSION_RESOURCE_ACTIONS ||
    resource in PROJECT_PERMISSION_RESOURCE_ACTIONS
  );
}

/**
 * Validates a `resource:action` pair.
 *
 * Strictness:
 * - resource must exist in either namespace map
 * - action must be declared for that exact resource
 * - wildcard action (`*`) is intentionally not accepted here
 */
export function isValidPermissionForResource(resource: string, action: string): boolean {
  const workspaceActions =
    WORKSPACE_PERMISSION_RESOURCE_ACTIONS[resource as keyof typeof WORKSPACE_PERMISSION_RESOURCE_ACTIONS];
  const teamspaceActions =
    TEAMSPACE_PERMISSION_RESOURCE_ACTIONS[resource as keyof typeof TEAMSPACE_PERMISSION_RESOURCE_ACTIONS];
  const projectActions =
    PROJECT_PERMISSION_RESOURCE_ACTIONS[resource as keyof typeof PROJECT_PERMISSION_RESOURCE_ACTIONS];
  const actions: readonly string[] | undefined = workspaceActions ?? teamspaceActions ?? projectActions;
  return actions ? actions.includes(action) : false;
}

/**
 * Validates a conditional suffix token (for example `creator` or `lead`).
 */
export function isValidPermissionCondition(condition: string): condition is PermissionCondition {
  return Object.values(PERMISSION_CONDITION_VALUES).includes(condition as PermissionCondition);
}
