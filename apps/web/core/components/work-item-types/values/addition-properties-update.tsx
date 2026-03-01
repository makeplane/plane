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

import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import type { TIssuePropertyValues } from "@plane/types";
import { EIssueServiceType, EWorkItemTypeEntity } from "@plane/types";
// plane web imports
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssueTypes } from "@/plane-web/hooks/store";
import { IssuePropertyValuesService } from "@/services/issue-types";
// local imports
import type { TWorkItemCustomPropertyValuesUpdateProps } from "./addition-properties-update-base";
import { WorkItemCustomPropertyValuesUpdateBase } from "./addition-properties-update-base";

/**
 * Store-connected wrapper for issue additional properties update.
 * Handles work item type store integration and data fetching.
 */
export const WorkItemCustomPropertyValuesUpdate = observer(function WorkItemCustomPropertyValuesUpdate(
  props: TWorkItemCustomPropertyValuesUpdateProps
) {
  const {
    issueId,
    projectId,
    workspaceSlug,
    entityType = EWorkItemTypeEntity.WORK_ITEM,
    issueServiceType = EIssueServiceType.ISSUES,
  } = props;
  // store hooks
  const {
    getIssueTypeById,
    isWorkItemTypeEntityEnabledForProject,
    getProjectWorkItemPropertiesLoader,
    fetchAllPropertiesAndOptions,
  } = useIssueTypes();
  const {
    activity: {
      issuePropertiesActivity: { fetchPropertyActivities },
    },
  } = useIssueDetail(issueServiceType);

  // services
  const issuePropertyValuesService = new IssuePropertyValuesService(issueServiceType);
  // derived values
  const isWorkItemTypeEntityEnabled = isWorkItemTypeEntityEnabledForProject(
    workspaceSlug?.toString(),
    projectId,
    entityType
  );
  const propertiesLoader = getProjectWorkItemPropertiesLoader(projectId, entityType);
  // fetch methods
  async function fetchIssuePropertyValues() {
    // This is required when accessing the peek overview from workspace level.
    await fetchAllPropertiesAndOptions(workspaceSlug, projectId, entityType);
    return issuePropertyValuesService.fetchAll(workspaceSlug, projectId, issueId);
  }

  // fetch issue property values
  const {
    data: issuePropertyValues,
    isLoading,
    mutate,
  } = useSWR(
    workspaceSlug && projectId && issueId && entityType && isWorkItemTypeEntityEnabled
      ? `ISSUE_PROPERTY_VALUES_${workspaceSlug}_${projectId}_${issueId}_${entityType}_${isWorkItemTypeEntityEnabled}`
      : null,
    () =>
      workspaceSlug && projectId && issueId && entityType && isWorkItemTypeEntityEnabled
        ? fetchIssuePropertyValues()
        : null,
    {
      revalidateOnFocus: false,
    }
  );

  const handlePropertyValueChange = (
    value: TIssuePropertyValues | ((prev: TIssuePropertyValues) => TIssuePropertyValues)
  ) => {
    mutate((prevData) => {
      const valueObj = typeof value === "function" ? value(prevData || {}) : value;
      return { ...prevData, ...valueObj };
    }, false);
  };

  return (
    <WorkItemCustomPropertyValuesUpdateBase
      {...props}
      getWorkItemTypeById={getIssueTypeById}
      areCustomPropertiesInitializing={propertiesLoader === "init-loader"}
      arePropertyValuesInitializing={isLoading}
      issuePropertyValues={issuePropertyValues || {}}
      isWorkItemTypeEntityEnabled={isWorkItemTypeEntityEnabledForProject}
      propertyValueChangeCallback={() =>
        fetchPropertyActivities(workspaceSlug, projectId, issueId, "init-loader", issueServiceType)
      }
      onPropertyValueChange={handlePropertyValueChange}
      updateService={issuePropertyValuesService.update.bind(
        issuePropertyValuesService,
        workspaceSlug,
        projectId,
        issueId
      )}
    />
  );
});
