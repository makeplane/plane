"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import { IIssueType, TIssuePropertyValues } from "@plane/types";
import { getPropertiesDefaultValues } from "@plane/utils";
// store hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// plane web imports
import { IssueAdditionalPropertyValues } from "@/plane-web/components/issue-types/values/root";

type TIssueAdditionalPropertyValuesCreateProps = {
  getWorkItemTypeById: (issueTypeId: string) => IIssueType | undefined;
  issueTypeId: string;
  issuePropertyValues: TIssuePropertyValues;
  arePropertyValuesInitializing: boolean;
  projectId: string;
};

export const IssueAdditionalPropertyValuesCreate: React.FC<TIssueAdditionalPropertyValuesCreateProps> = observer(
  (props) => {
    const { getWorkItemTypeById, issueTypeId, issuePropertyValues, arePropertyValuesInitializing, projectId } = props;
    // store hooks
    const {
      workItemTemplateId,
      issuePropertyValues: issuePropertyDefaultValues,
      issuePropertyValueErrors,
      setIssuePropertyValues: handleIssuePropertyValueUpdate,
    } = useIssueModal();
    const issueType = getWorkItemTypeById(issueTypeId);
    // derived values
    const issueTypeDetail = issueType?.asJSON;
    const activeProperties = issueType?.activeProperties;

    useEffect(() => {
      // If template is applied, then we don't need to set the default values from here.
      // It will be set in the provider -> handleTemplateChange.
      if (!workItemTemplateId && activeProperties?.length) {
        handleIssuePropertyValueUpdate({
          ...getPropertiesDefaultValues(activeProperties),
          ...issuePropertyValues,
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeProperties, handleIssuePropertyValueUpdate, workItemTemplateId]);

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
          getWorkItemTypeById={getWorkItemTypeById}
          handlePropertyValueChange={handlePropertyValueChange}
          arePropertyValuesInitializing={arePropertyValuesInitializing}
          issuePropertyValueErrors={issuePropertyValueErrors}
          issuePropertyValues={issuePropertyDefaultValues}
          issueTypeId={issueTypeId}
          projectId={projectId}
          variant="create"
        />
      </div>
    );
  }
);
