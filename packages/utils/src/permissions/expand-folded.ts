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

import type { PermissionMatrixGroup } from "@plane/constants";
import type { PermissionGrantString, PermissionString } from "@plane/types";
import { buildConditionalGrant } from "./set-resolution";
import { parsePermissionGrantString } from "./string";

/**
 * Expands folded parent permissions back to their full set of children for the backend.
 *
 * When a parent permission (e.g. "initiative:view") has `foldedChildren`, every grant
 * for that parent is replaced by grants for each child, preserving any conditions.
 * Non-folded permissions pass through unchanged.
 */
export const expandFoldedPermissions = (
  permissions: Partial<Record<PermissionGrantString, true>>,
  groups: PermissionMatrixGroup[]
): Partial<Record<PermissionGrantString, true>> => {
  // Build fold map from group rows
  const foldMap = new Map<PermissionString, PermissionString[]>();
  for (const group of groups) {
    for (const row of group.rows) {
      if (row.foldedChildren && row.foldedChildren.length > 0) {
        foldMap.set(row.rowId, row.foldedChildren);
      }
    }
  }

  if (foldMap.size === 0) return permissions;

  const expanded: Partial<Record<PermissionGrantString, true>> = {};

  for (const [grant, enabled] of Object.entries(permissions) as [PermissionGrantString, true | undefined][]) {
    if (!enabled) continue;

    const parsed = parsePermissionGrantString(grant);
    if (!parsed || parsed.action === "*") {
      expanded[grant] = true;
      continue;
    }

    const base = `${parsed.resource}:${parsed.action}` as PermissionString;
    const children = foldMap.get(base);

    if (!children) {
      // Not a fold parent — keep as-is
      expanded[grant] = true;
      continue;
    }

    // Expand: grant each child with the same conditions
    for (const child of children) {
      const childGrant = buildConditionalGrant(child, parsed.conditions);
      expanded[childGrant] = true;
    }
  }

  return expanded;
};
