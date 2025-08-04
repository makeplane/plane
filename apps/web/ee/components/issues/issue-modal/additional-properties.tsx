"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { EIssueServiceType, EWorkItemTypeEntity, TIssueServiceType } from "@plane/types";
// plane web imports
import { useIssueTypes } from "@/plane-web/hooks/store";
import { DraftIssuePropertyValuesService } from "@/plane-web/services/issue-types/draft-issue-property-values.service";
import { IssuePropertyValuesService } from "@/plane-web/services/issue-types/issue-property-values.service";
// local imports
import { IssueAdditionalPropertiesBase } from "./additional-properties-base";

const draftIssuePropertyValuesService = new DraftIssuePropertyValuesService();

type TIssueAdditionalPropertiesProps = {
  issueId: string | undefined;
  issueTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  entityType?: EWorkItemTypeEntity;
  isDraft?: boolean;
  issueServiceType?: TIssueServiceType;
};

/**
 * Store-connected wrapper for issue additional properties.
 * Handles work item type store integration and data fetching.
 */
export const IssueAdditionalProperties: React.FC<TIssueAdditionalPropertiesProps> = observer((props) => {
  const {
    issueId,
    isDraft = false,
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
  // states
  const [issuePropertyValues, setIssuePropertyValues] = React.useState({});
  // services
  const issuePropertyValuesService = new IssuePropertyValuesService(issueServiceType);
  // derived values
  const isWorkItemTypeEntityEnabled = isWorkItemTypeEntityEnabledForProject(workspaceSlug, projectId, entityType);
  const propertiesLoader = getProjectWorkItemPropertiesLoader(projectId, entityType);

  // fetch issue property values
  const { data, isLoading: arePropertyValuesInitializing } = useSWR(
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

  useEffect(() => {
    if (data) setIssuePropertyValues(data);
  }, [data]);

  // This has to be on root level because of global level issue update, where we haven't fetch the details yet.
  useEffect(() => {
    if (projectId && isWorkItemTypeEntityEnabled) {
      fetchAllPropertiesAndOptions(workspaceSlug?.toString(), projectId, entityType);
    }
  }, [fetchAllPropertiesAndOptions, isWorkItemTypeEntityEnabled, projectId, workspaceSlug, entityType]);

  return (
    <IssueAdditionalPropertiesBase
      getWorkItemTypeById={getIssueTypeById}
      areCustomPropertiesInitializing={propertiesLoader === "init-loader"}
      isWorkItemTypeEntityEnabled={isWorkItemTypeEntityEnabledForProject}
      issuePropertyValues={issuePropertyValues}
      arePropertyValuesInitializing={arePropertyValuesInitializing}
      {...props}
    />
  );
});
