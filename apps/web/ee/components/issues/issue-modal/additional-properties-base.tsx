"use client";

import React from "react";
import { observer } from "mobx-react";
import { EWorkItemTypeEntity, IIssueType, TIssuePropertyValues } from "@plane/types";
// ui
import { Loader } from "@plane/ui";
// plane web components
import { IssueAdditionalPropertyValuesCreate } from "@/plane-web/components/issue-types/values/create";

type TIssueAdditionalPropertiesBaseProps = {
  areCustomPropertiesInitializing: boolean;
  arePropertyValuesInitializing: boolean;
  entityType?: EWorkItemTypeEntity;
  getWorkItemTypeById: (issueTypeId: string) => IIssueType | undefined;
  issuePropertyValues: TIssuePropertyValues;
  issueTypeId: string | null;
  isWorkItemTypeEntityEnabled: (workspaceSlug: string, projectId: string, entityType: EWorkItemTypeEntity) => boolean;
  projectId: string;
  shouldLoadDefaultValues: boolean;
  workspaceSlug: string;
};

/**
 * Store-independent component for custom properties.
 * Receives all data and methods as props to enable reusability across different contexts.
 * Use the wrapper component for automatic store integration.
 * Required Issue Modal context to be available in the parent component.
 */
export const IssueAdditionalPropertiesBase: React.FC<TIssueAdditionalPropertiesBaseProps> = observer((props) => {
  const {
    areCustomPropertiesInitializing = false,
    arePropertyValuesInitializing = false,
    entityType = EWorkItemTypeEntity.WORK_ITEM,
    getWorkItemTypeById,
    issuePropertyValues,
    issueTypeId,
    isWorkItemTypeEntityEnabled,
    projectId,
    shouldLoadDefaultValues,
    workspaceSlug,
  } = props;
  // derived values
  const isWorkItemTypeEnabled = isWorkItemTypeEntityEnabled(workspaceSlug, projectId, entityType);

  if (!isWorkItemTypeEnabled || !issueTypeId) return null;

  if (areCustomPropertiesInitializing) {
    return (
      <Loader className="space-y-4 py-2">
        <Loader.Item height="30px" />
        <Loader.Item height="30px" />
        <Loader.Item height="30px" width="50%" />
        <Loader.Item height="30px" width="50%" />
      </Loader>
    );
  }

  return (
    <IssueAdditionalPropertyValuesCreate
      arePropertyValuesInitializing={arePropertyValuesInitializing}
      getWorkItemTypeById={getWorkItemTypeById}
      issuePropertyValues={issuePropertyValues}
      issueTypeId={issueTypeId}
      projectId={projectId}
      shouldLoadDefaultValues={shouldLoadDefaultValues}
    />
  );
});
