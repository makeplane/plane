"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// helpers
import { getPropertiesDefaultValues } from "@/plane-web/helpers/issue-properties.helper";
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
  isDraft?: boolean;
};

const issuePropertyValuesService = new IssuePropertyValuesService();
const draftIssuePropertyValuesService = new DraftIssuePropertyValuesService();

export const IssueAdditionalPropertyValuesCreate: React.FC<TIssueAdditionalPropertyValuesCreateProps> = observer(
  (props) => {
    const { issueId, issueTypeId, projectId, workspaceSlug, isDraft = false } = props;
    // states
    const [issuePropertyValues, setIssuePropertyValues] = React.useState({});
    // store hooks
    const {
      issuePropertyValues: issuePropertyDefaultValues,
      issuePropertyValueErrors,
      setIssuePropertyValues: handleIssuePropertyValueUpdate,
    } = useIssueModal();
    const issueType = useIssueType(issueTypeId);
    const { isIssueTypeEnabledForProject } = useIssueTypes();
    // derived values
    const issueTypeDetail = issueType?.asJSON;
    const activeProperties = issueType?.activeProperties;
    const isIssueTypeDisplayEnabled = isIssueTypeEnabledForProject(
      workspaceSlug?.toString(),
      projectId,
      "ISSUE_TYPE_DISPLAY"
    );
    // fetch issue property values
    const { data, isLoading } = useSWR(
      workspaceSlug && projectId && issueId && isIssueTypeDisplayEnabled
        ? `ISSUE_PROPERTY_VALUES_${workspaceSlug}_${projectId}_${issueId}_${isIssueTypeDisplayEnabled}`
        : null,
      () =>
        workspaceSlug && projectId && issueId && isIssueTypeDisplayEnabled
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
      if (activeProperties?.length) {
        handleIssuePropertyValueUpdate({
          ...getPropertiesDefaultValues(activeProperties),
          ...issuePropertyValues,
        });
      }
    }, [activeProperties, handleIssuePropertyValueUpdate, issuePropertyValues]);

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
