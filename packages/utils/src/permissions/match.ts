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

import type { PermissionConditionContext, PermissionGrantString, PermissionString } from "@plane/types";
import { parsePermissionGrantString } from "./string";

function getBasePermission(permission: PermissionGrantString): PermissionString {
  const plusIndex = permission.indexOf("+");
  return (plusIndex === -1 ? permission : permission.slice(0, plusIndex)) as PermissionString;
}

/**
 * Evaluates whether a grant map authorizes a permission.
 *
 * Matching order (first successful check wins):
 * 1. global wildcard (`*`)
 * 2. exact grant (`resource:action`)
 * 3. resource wildcard (`resource:*`)
 * 4. conditional grant (`resource:action+...`) with a satisfied condition context
 */
export function matchesPermissionGrant(args: {
  permissions: Array<PermissionGrantString>;
  permissionToCheck: PermissionString;
  conditionContext?: PermissionConditionContext;
}): boolean {
  const { permissions, permissionToCheck, conditionContext } = args;
  // Convert the array to a set for O(1) lookup
  const permissionGrants = new Set(permissions);

  if (permissionGrants.has("*")) return true;
  if (permissionGrants.has(permissionToCheck)) return true;

  const parsed = parsePermissionGrantString(permissionToCheck);
  if (!parsed) return false;

  if (permissionGrants.has(`${parsed.resource}:*`)) return true;

  for (const grantedPermission of permissionGrants) {
    if (getBasePermission(grantedPermission) !== permissionToCheck) continue;

    const grantedParsed = parsePermissionGrantString(grantedPermission);
    if (!grantedParsed || grantedParsed.conditions.length === 0) continue;

    // Conditional grants are never assumed true without explicit runtime context.
    if (!conditionContext) return false;

    const allConditionsMatched = grantedParsed.conditions.every((condition) => conditionContext[condition] === true);
    if (allConditionsMatched) return true;
  }

  return false;
}
