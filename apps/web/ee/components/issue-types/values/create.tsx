"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import { IIssueType, TIssuePropertyValues } from "@plane/types";
import { getPropertiesDefaultValues } from "@plane/utils";
// store hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// local imports
import { IssueAdditionalPropertyValues } from "./root";

type TIssueAdditionalPropertyValuesCreateProps = {
  arePropertyValuesInitializing: boolean;
  getWorkItemTypeById: (issueTypeId: string) => IIssueType | undefined;
  issuePropertyValues: TIssuePropertyValues;
  issueTypeId: string;
  projectId: string;
  shouldLoadDefaultValues: boolean;
};

export const IssueAdditionalPropertyValuesCreate: React.FC<TIssueAdditionalPropertyValuesCreateProps> = observer(
  (props) => {
    const {
      arePropertyValuesInitializing,
      getWorkItemTypeById,
      issuePropertyValues,
      issueTypeId,
      projectId,
      shouldLoadDefaultValues,
    } = props;
    // store hooks
    const {
      issuePropertyValues: issuePropertyDefaultValues,
      issuePropertyValueErrors,
      setIssuePropertyValues: handleIssuePropertyValueUpdate,
    } = useIssueModal();
    const issueType = getWorkItemTypeById(issueTypeId);
    // derived values
    const issueTypeDetail = issueType?.asJSON;
    const activeProperties = issueType?.activeProperties;

    useEffect(() => {
      // Only set default values if shouldLoadDefaultValues is true and we have active properties
      if (shouldLoadDefaultValues && activeProperties?.length) {
        handleIssuePropertyValueUpdate({
          ...getPropertiesDefaultValues(activeProperties),
          ...issuePropertyValues,
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeProperties, handleIssuePropertyValueUpdate, shouldLoadDefaultValues]);

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
