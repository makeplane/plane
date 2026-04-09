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

import { useEffect, useMemo } from "react";
// plane imports
import { EWorkItemTypeEntity } from "@plane/types";
import type { IIssueDisplayProperties } from "@plane/types";
// hooks
import { useFeatureFlags, useIssueTypes } from "@/plane-web/hooks/store";
// helpers
import { buildCustomPropertyColumns } from "@/helpers/work-item-layout";

type UseSpreadsheetCustomPropertyColumnsOptions = {
  workspaceSlug: string;
  projectIds: string[];
  isEpic: boolean;
};

/**
 * Hook that fetches work item type properties and builds custom property column IDs
 * for the spreadsheet layout. The caller provides the scoped projectIds
 * (single project, teamspace projects, or all joined projects for workspace views).
 */
export function useSpreadsheetCustomPropertyColumns(
  options: UseSpreadsheetCustomPropertyColumnsOptions
): (keyof IIssueDisplayProperties)[] {
  const { workspaceSlug, projectIds, isEpic } = options;

  const {
    getProjectIssueTypes,
    isWorkItemTypeEntityEnabledForProject,
    fetchAllPropertiesAndOptions,
    getProjectWorkItemPropertiesFetchedMap,
  } = useIssueTypes();
  const { getFeatureFlag } = useFeatureFlags();

  const isFeatureEnabled = workspaceSlug
    ? getFeatureFlag(workspaceSlug, "SPREADSHEET_CUSTOM_PROPERTIES", false)
    : false;

  const shouldFetch = !isEpic && isFeatureEnabled && projectIds.length > 0 && !!workspaceSlug;

  // Fetch properties for projects that haven't been fetched yet
  useEffect(() => {
    if (!shouldFetch) return;

    const unfetchedProjectIds = projectIds.filter((pid) => {
      const isEnabled = isWorkItemTypeEntityEnabledForProject(workspaceSlug, pid, EWorkItemTypeEntity.WORK_ITEM);
      if (!isEnabled) return false;
      return !getProjectWorkItemPropertiesFetchedMap(pid, EWorkItemTypeEntity.WORK_ITEM);
    });

    if (unfetchedProjectIds.length === 0) return;

    Promise.allSettled(
      unfetchedProjectIds.map((pid) => fetchAllPropertiesAndOptions(workspaceSlug, pid, EWorkItemTypeEntity.WORK_ITEM))
    );
  }, [
    shouldFetch,
    workspaceSlug,
    projectIds,
    isWorkItemTypeEntityEnabledForProject,
    fetchAllPropertiesAndOptions,
    getProjectWorkItemPropertiesFetchedMap,
  ]);

  // Build custom property columns
  const customPropertyColumns = useMemo(() => {
    if (!shouldFetch) return [];
    return buildCustomPropertyColumns(
      projectIds,
      getProjectIssueTypes,
      isWorkItemTypeEntityEnabledForProject,
      workspaceSlug
    );
  }, [shouldFetch, projectIds, getProjectIssueTypes, isWorkItemTypeEntityEnabledForProject, workspaceSlug]);

  return customPropertyColumns;
}
