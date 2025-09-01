"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EIssueServiceType, EWorkItemTypeEntity, TIssuePropertyValues } from "@plane/types";
// plane web imports
import { useIssuePropertiesActivity, useIssueTypes } from "@/plane-web/hooks/store";
import { IssuePropertyValuesService } from "@/plane-web/services/issue-types";
// local imports
import {
  IssueAdditionalPropertyValuesUpdateBase,
  TIssueAdditionalPropertyValuesUpdateProps,
} from "./addition-properties-update-base";

/**
 * Store-connected wrapper for issue additional properties update.
 * Handles work item type store integration and data fetching.
 */
export const IssueAdditionalPropertyValuesUpdate: React.FC<TIssueAdditionalPropertyValuesUpdateProps> = observer(
  (props) => {
    const {
      issueId,
      projectId,
      workspaceSlug,
      entityType = EWorkItemTypeEntity.WORK_ITEM,
      issueServiceType = EIssueServiceType.ISSUES,
    } = props;
    // states
    const [issuePropertyValues, setIssuePropertyValues] = React.useState<TIssuePropertyValues>({});
    // store hooks
    const {
      getIssueTypeById,
      isWorkItemTypeEntityEnabledForProject,
      getProjectWorkItemPropertiesLoader,
      fetchAllPropertiesAndOptions,
    } = useIssueTypes();
    const { fetchPropertyActivities } = useIssuePropertiesActivity();
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
    const { data, isLoading } = useSWR(
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

    useEffect(() => {
      if (data) setIssuePropertyValues(data);
    }, [data]);

    return (
      <IssueAdditionalPropertyValuesUpdateBase
        {...props}
        getWorkItemTypeById={getIssueTypeById}
        areCustomPropertiesInitializing={propertiesLoader === "init-loader"}
        arePropertyValuesInitializing={isLoading}
        issuePropertyValues={issuePropertyValues}
        isWorkItemTypeEntityEnabled={isWorkItemTypeEntityEnabledForProject}
        propertyValueChangeCallback={() => fetchPropertyActivities(workspaceSlug, projectId, issueId)}
        setIssuePropertyValues={setIssuePropertyValues}
        updateService={issuePropertyValuesService.update.bind(
          issuePropertyValuesService,
          workspaceSlug,
          projectId,
          issueId
        )}
      />
    );
  }
);
