import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
// plane imports
import { TIssuePropertyValueErrors, TIssuePropertyValues } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { getPropertiesDefaultValues } from "@plane/utils";
// components
import {
  IssueModalContext,
  TActiveAdditionalPropertiesProps,
  TCreateUpdatePropertyValuesProps,
  TPropertyValuesValidationProps,
} from "@/components/issues";
// plane web hooks
import { useIssuePropertiesActivity, useIssueTypes } from "@/plane-web/hooks/store";
// plane web services
import { DraftIssuePropertyValuesService, IssuePropertyValuesService } from "@/plane-web/services/issue-types";

type TIssueModalProviderProps = {
  children: React.ReactNode;
};

const issuePropertyValuesService = new IssuePropertyValuesService();
const draftIssuePropertyValuesService = new DraftIssuePropertyValuesService();

export const IssueModalProvider = observer((props: TIssueModalProviderProps) => {
  const { children } = props;
  // states
  const [issuePropertyValues, setIssuePropertyValues] = useState<TIssuePropertyValues>({});
  const [issuePropertyValueErrors, setIssuePropertyValueErrors] = useState<TIssuePropertyValueErrors>({});
  // plane web hooks
  const {
    isWorkItemTypeEnabledForProject,
    getIssueTypeById,
    getIssueTypeProperties,
    getProjectIssueTypes,
    getProjectDefaultIssueType,
  } = useIssueTypes();
  const { fetchPropertyActivities } = useIssuePropertiesActivity();
  // helpers
  const getIssueTypeIdOnProjectChange = (projectId: string) => {
    // get active issue types for the project
    const projectIssueTypes = getProjectIssueTypes(projectId, true);
    // get default issue type for the project
    const defaultIssueType = getProjectDefaultIssueType(projectId);
    // if project has issue types, get the default issue type id or the first issue type id
    if (projectIssueTypes) {
      if (defaultIssueType?.id) {
        return defaultIssueType.id;
      } else {
        const issueTypeId = Object.keys(projectIssueTypes)[0];
        if (issueTypeId) return issueTypeId;
      }
    }
    // if no issue type available, return null
    return null;
  };

  const getActiveAdditionalPropertiesLength = (props: TActiveAdditionalPropertiesProps) => {
    const { projectId, watch, workspaceSlug } = props;
    const issueTypeId = watch("type_id");
    // if issue type is not enabled for the project or no issue type id, return 0
    const isWorkItemTypeEnabled = !!projectId && isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
    if (!isWorkItemTypeEnabled || !issueTypeId) return 0;
    // all properties for the issue type
    const properties = getIssueTypeProperties(issueTypeId);
    // filter all active properties
    const activeProperties = properties?.filter((property) => property.is_active);
    return activeProperties?.length || 0;
  };

  // handlers
  const handlePropertyValuesValidation = (props: TPropertyValuesValidationProps) => {
    const { projectId, watch, workspaceSlug } = props;

    const issueTypeId = watch("type_id");
    // if issue type is not enabled for the project, skip validation
    const isWorkItemTypeEnabled = !!projectId && isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
    if (!isWorkItemTypeEnabled) return true;
    // if no issue type id or no issue property values, skip validation
    if (!issueTypeId) return true;
    // all properties for the issue type
    const properties = getIssueTypeProperties(issueTypeId);
    // filter all active & required propertyIds
    const activeRequiredPropertyIds = properties
      ?.filter((property) => property.is_active && property.is_required)
      .map((property) => property.id);
    // filter missing required property based on property values
    const missingRequiredPropertyIds = activeRequiredPropertyIds?.filter(
      (propertyId) =>
        propertyId &&
        (!issuePropertyValues[propertyId] ||
          !issuePropertyValues[propertyId].length ||
          issuePropertyValues[propertyId][0].trim() === "")
    );
    // set error state
    setIssuePropertyValueErrors(
      missingRequiredPropertyIds?.reduce((acc, propertyId) => {
        if (propertyId) acc[propertyId] = "REQUIRED";
        return acc;
      }, {} as TIssuePropertyValueErrors)
    );
    // return true if no missing required properties values
    return missingRequiredPropertyIds.length === 0;
  };

  const handleCreateUpdatePropertyValues = async (props: TCreateUpdatePropertyValuesProps) => {
    const { workspaceSlug, projectId, issueTypeId, issueId, isDraft = false } = props;
    // check if issue property values are empty
    if (Object.keys(issuePropertyValues).length === 0) return;
    // check if issue type display is enabled
    const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
    if (!isWorkItemTypeEnabled) return;
    // get issue type details
    const issueType = issueTypeId ? getIssueTypeById(issueTypeId) : null;
    // get draft issue type details
    // filter property values that belongs to the issue type (required when issue type is changed)
    const filteredIssuePropertyValues = Object.keys(issuePropertyValues).reduce((acc, propertyId) => {
      if (issueType?.activeProperties?.find((property) => property.id === propertyId)) {
        acc[propertyId] = issuePropertyValues[propertyId];
      }
      return acc;
    }, {} as TIssuePropertyValues);
    // create issue property values
    await (
      isDraft
        ? draftIssuePropertyValuesService.create(workspaceSlug, projectId, issueId, filteredIssuePropertyValues)
        : issuePropertyValuesService.create(workspaceSlug, projectId, issueId, filteredIssuePropertyValues)
    )
      .then(() => {
        // mutate issue property values
        mutate(`ISSUE_PROPERTY_VALUES_${workspaceSlug}_${projectId}_${issueId}_${isWorkItemTypeEnabled}`);
        // fetch property activities
        fetchPropertyActivities(workspaceSlug, projectId, issueId);
        // reset issue property values
        setIssuePropertyValues({
          ...getPropertiesDefaultValues(issueType?.activeProperties ?? []),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Custom properties could not be created. Please try again.",
        });
      });
  };

  return (
    <IssueModalContext.Provider
      value={{
        issuePropertyValues,
        setIssuePropertyValues,
        issuePropertyValueErrors,
        setIssuePropertyValueErrors,
        getIssueTypeIdOnProjectChange,
        getActiveAdditionalPropertiesLength,
        handlePropertyValuesValidation,
        handleCreateUpdatePropertyValues,
      }}
    >
      {children}
    </IssueModalContext.Provider>
  );
});
