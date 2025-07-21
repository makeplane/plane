"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { EWorkItemTypeEntity, IIssueType, TIssuePropertyValues, TIssueServiceType } from "@plane/types";
import { Loader, setToast, TOAST_TYPE } from "@plane/ui";
// plane web imports
import { IssueAdditionalPropertyValues } from "@/plane-web/components/issue-types";

export type TIssueAdditionalPropertyValuesUpdateProps = {
  entityType?: EWorkItemTypeEntity;
  isDisabled: boolean;
  issueId: string;
  issueServiceType?: TIssueServiceType;
  issueTypeId: string;
  projectId: string;
  workspaceSlug: string;
};

type TIssueAdditionalPropertyValuesUpdateBaseProps = TIssueAdditionalPropertyValuesUpdateProps & {
  getWorkItemTypeById: (issueTypeId: string) => IIssueType | undefined;
  areCustomPropertiesInitializing: boolean;
  arePropertyValuesInitializing: boolean;
  issuePropertyValues: TIssuePropertyValues;
  isWorkItemTypeEntityEnabled: (workspaceSlug: string, projectId: string, entityType: EWorkItemTypeEntity) => boolean;
  propertyValueChangeCallback: (propertyId: string, value: string[]) => void;
  setIssuePropertyValues: (
    issuePropertyValues: TIssuePropertyValues | ((prev: TIssuePropertyValues) => TIssuePropertyValues)
  ) => void;
  updateService: (propertyId: string, value: string[]) => Promise<void>;
};

/**
 * Store-independent component for custom properties update.
 * Receives all data and methods as props to enable reusability across different contexts.
 * Use the wrapper component for automatic store integration.
 */
export const IssueAdditionalPropertyValuesUpdateBase: React.FC<TIssueAdditionalPropertyValuesUpdateBaseProps> =
  observer((props) => {
    const {
      entityType = EWorkItemTypeEntity.WORK_ITEM,
      getWorkItemTypeById,
      areCustomPropertiesInitializing,
      isDisabled,
      arePropertyValuesInitializing,
      issuePropertyValues,
      issueTypeId,
      isWorkItemTypeEntityEnabled,
      propertyValueChangeCallback,
      projectId,
      setIssuePropertyValues,
      updateService,
      workspaceSlug,
    } = props;
    // store hooks
    const issueType = getWorkItemTypeById(issueTypeId);
    // derived values
    const isWorkItemTypeEnabled = isWorkItemTypeEntityEnabled(workspaceSlug?.toString(), projectId, entityType);
    const issueTypeDetails = issueType?.asJSON;
    const activeProperties = issueType?.activeProperties;

    const handlePropertyValueChange = async (propertyId: string, value: string[]) => {
      const beforeUpdateValue = issuePropertyValues[propertyId];
      setIssuePropertyValues((prev) => ({
        ...prev,
        [propertyId]: value,
      }));
      // update the property value
      await updateService(propertyId, value)
        .then(() => propertyValueChangeCallback(propertyId, value))
        .catch((error) => {
          // revert the value if update fails
          setIssuePropertyValues((prev) => ({
            ...prev,
            [propertyId]: beforeUpdateValue,
          }));
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: error?.error ?? "Property could not be update. Please try again.",
          });
        });
    };

    // if issue types are not enabled, return null
    if (!isWorkItemTypeEnabled) return <></>;

    if (areCustomPropertiesInitializing) {
      return (
        <Loader className="space-y-4 py-4">
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
        </Loader>
      );
    }

    // if issue type details or active properties are not available, return null
    if (!issueTypeDetails || !activeProperties?.length) return null;

    return (
      <IssueAdditionalPropertyValues
        getWorkItemTypeById={getWorkItemTypeById}
        issueTypeId={issueTypeId}
        projectId={projectId}
        issuePropertyValues={issuePropertyValues}
        variant="update"
        arePropertyValuesInitializing={arePropertyValuesInitializing}
        handlePropertyValueChange={handlePropertyValueChange}
        isDisabled={isDisabled}
      />
    );
  });
