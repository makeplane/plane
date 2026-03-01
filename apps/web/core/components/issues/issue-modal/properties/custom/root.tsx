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

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType, EWorkItemTypeEntity } from "@plane/types";
// plane web imports
import { useIssueTypes } from "@/plane-web/hooks/store";
import { DraftIssuePropertyValuesService } from "@/services/issue-types/draft-issue-property-values.service";
import { IssuePropertyValuesService } from "@/services/issue-types/issue-property-values.service";
// local imports
import { WorkItemCustomPropertiesBase } from "./base";

const draftIssuePropertyValuesService = new DraftIssuePropertyValuesService();

type TWorkItemCustomPropertiesProps = {
  entityType?: EWorkItemTypeEntity;
  isDraft?: boolean;
  issueId: string | undefined;
  issueServiceType?: TIssueServiceType;
  issueTypeId: string | null;
  projectId: string;
  shouldLoadDefaultValues?: boolean;
  workspaceSlug: string;
};

/**
 * Store-connected wrapper for issue additional properties.
 * Handles work item type store integration and data fetching.
 */
export const WorkItemCustomProperties = observer(function WorkItemCustomProperties(
  props: TWorkItemCustomPropertiesProps
) {
  const {
    entityType = EWorkItemTypeEntity.WORK_ITEM,
    isDraft = false,
    issueId,
    issueServiceType = EIssueServiceType.ISSUES,
    projectId,
    shouldLoadDefaultValues = true,
    workspaceSlug,
  } = props;
  // store hooks
  const {
    getIssueTypeById,
    isWorkItemTypeEntityEnabledForProject,
    getProjectWorkItemPropertiesLoader,
    fetchAllPropertiesAndOptions,
  } = useIssueTypes();
  // services
  const issuePropertyValuesService = new IssuePropertyValuesService(issueServiceType);
  // derived values
  const isWorkItemTypeEntityEnabled = isWorkItemTypeEntityEnabledForProject(workspaceSlug, projectId, entityType);
  const propertiesLoader = getProjectWorkItemPropertiesLoader(projectId, entityType);

  // fetch issue property values
  const { data: issuePropertyValues, isLoading: arePropertyValuesInitializing } = useSWR(
    workspaceSlug && projectId && issueId && entityType && isWorkItemTypeEntityEnabled
      ? `ISSUE_PROPERTY_VALUES_${workspaceSlug}_${projectId}_${issueId}_${entityType}_${isWorkItemTypeEntityEnabled}`
      : null,
    () =>
      workspaceSlug && projectId && issueId && entityType && isWorkItemTypeEntityEnabled
        ? isDraft
          ? draftIssuePropertyValuesService.fetchAll(workspaceSlug, projectId, issueId)
          : issuePropertyValuesService.fetchAll(workspaceSlug, projectId, issueId)
        : null,
    {}
  );

  // This has to be on root level because of global level issue update, where we haven't fetch the details yet.
  useEffect(() => {
    if (projectId && isWorkItemTypeEntityEnabled) {
      fetchAllPropertiesAndOptions(workspaceSlug?.toString(), projectId, entityType);
    }
  }, [fetchAllPropertiesAndOptions, isWorkItemTypeEntityEnabled, projectId, workspaceSlug, entityType]);

  return (
    <WorkItemCustomPropertiesBase
      areCustomPropertiesInitializing={propertiesLoader === "init-loader"}
      arePropertyValuesInitializing={arePropertyValuesInitializing}
      getWorkItemTypeById={getIssueTypeById}
      issuePropertyValues={issuePropertyValues ?? {}}
      isWorkItemTypeEntityEnabled={isWorkItemTypeEntityEnabledForProject}
      shouldLoadDefaultValues={shouldLoadDefaultValues}
      {...props}
    />
  );
});
