"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EIssueServiceType, EWorkItemTypeEntity } from "@plane/constants";
import { TIssueServiceType } from "@plane/types";
import { getPropertiesDefaultValues } from "@plane/utils";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// plane web hooks
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";
// plane web services
import { DraftIssuePropertyValuesService, IssuePropertyValuesService } from "@/plane-web/services/issue-types";
// local components
import { IssueAdditionalPropertyValues } from "./root";

type TIssueAdditionalPropertyValuesCreateProps = {
  issueId: string | undefined;
  issueTypeId: string;
  projectId: string;
  workspaceSlug: string;
  entityType: EWorkItemTypeEntity;
  isDraft?: boolean;
  issueServiceType?: TIssueServiceType;
};

const draftIssuePropertyValuesService = new DraftIssuePropertyValuesService();

export const IssueAdditionalPropertyValuesCreate: React.FC<TIssueAdditionalPropertyValuesCreateProps> = observer(
  (props) => {
    const {
      issueId,
      issueTypeId,
      projectId,
      workspaceSlug,
      entityType,
      isDraft = false,
      issueServiceType = EIssueServiceType.ISSUES,
    } = props;
    // states
    const [issuePropertyValues, setIssuePropertyValues] = React.useState({});
    // store hooks
    const {
      workItemTemplateId,
      issuePropertyValues: issuePropertyDefaultValues,
      issuePropertyValueErrors,
      setIssuePropertyValues: handleIssuePropertyValueUpdate,
    } = useIssueModal();
    const issueType = useIssueType(issueTypeId);
    const { isWorkItemTypeEntityEnabledForProject } = useIssueTypes();
    // services
    const issuePropertyValuesService = new IssuePropertyValuesService(issueServiceType);
    // derived values
    const issueTypeDetail = issueType?.asJSON;
    const activeProperties = issueType?.activeProperties;
    const isWorkItemTypeEntityEnabled = isWorkItemTypeEntityEnabledForProject(workspaceSlug, projectId, entityType);
    // fetch issue property values
    const { data, isLoading } = useSWR(
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

    useEffect(() => {
      // If template is applied, then we don't need to set the default values from here.
      // It will be set in the provider -> handleTemplateChange.
      if (!workItemTemplateId && activeProperties?.length) {
        handleIssuePropertyValueUpdate({
          ...getPropertiesDefaultValues(activeProperties),
          ...issuePropertyValues,
        });
      }
    }, [activeProperties, handleIssuePropertyValueUpdate, issuePropertyValues, workItemTemplateId]);

    const handlePropertyValueChange = (propertyId: string, value: string[]) => {
      handleIssuePropertyValueUpdate((prev) => ({
        ...prev,
        [propertyId]: value,
      }));
    };

    if (!issueTypeDetail || !activeProperties?.length) return null;

    return (
      <div className="pt-2">
        <IssueAdditionalPropertyValues
          issueTypeId={issueTypeId}
          projectId={projectId}
          issuePropertyValues={issuePropertyDefaultValues}
          issuePropertyValueErrors={issuePropertyValueErrors}
          variant="create"
          isPropertyValuesLoading={isLoading}
          handlePropertyValueChange={handlePropertyValueChange}
        />
      </div>
    );
  }
);
