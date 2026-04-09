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

import type { IIssueDisplayProperties, IIssueType, EIssuePropertyType, IIssueProperty } from "@plane/types";
import { EWorkItemTypeEntity } from "@plane/types";

/**
 * Builds custom property column IDs from project issue types.
 * De-duplicates by property ID across all issue types.
 */
export function buildCustomPropertyColumns(
  projectIds: string[],
  getProjectIssueTypes: (pid: string, activeOnly: boolean) => Record<string, IIssueType> | undefined,
  isWorkItemTypeEntityEnabledForProject: (ws: string, pid: string, entity: EWorkItemTypeEntity) => boolean,
  workspaceSlug: string
): (keyof IIssueDisplayProperties)[] {
  const seenPropertyIds = new Set<string>();
  const columns: (keyof IIssueDisplayProperties)[] = [];

  for (const pid of projectIds) {
    const isEnabled = isWorkItemTypeEntityEnabledForProject(workspaceSlug, pid, EWorkItemTypeEntity.WORK_ITEM);
    if (!isEnabled) continue;

    const projectIssueTypes = getProjectIssueTypes(pid, true);
    if (!projectIssueTypes) continue;

    Object.values(projectIssueTypes).forEach((issueType) => {
      issueType.activeProperties.forEach((property: IIssueProperty<EIssuePropertyType>) => {
        if (property.id && !seenPropertyIds.has(property.id)) {
          seenPropertyIds.add(property.id);
          columns.push(`customproperty_${property.id}` as keyof IIssueDisplayProperties);
        }
      });
    });
  }

  return columns;
}
