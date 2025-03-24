import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
import { EIssueServiceType } from "@plane/constants";
// plane imports
import { ISearchIssueResponse, TIssuePropertyValueErrors, TIssuePropertyValues } from "@plane/types";
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
import { IssuePropertyValuesService } from "@/plane-web/services/issue-types";

type TEpicModalProviderProps = {
  children: React.ReactNode;
};

const epicPropertyValuesService = new IssuePropertyValuesService(EIssueServiceType.EPICS);

export const EpicModalProvider = observer((props: TEpicModalProviderProps) => {
  const { children } = props;
  // states
  const [workItemTemplateId, setWorkItemTemplateId] = useState<string | null>(null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);
  const [issuePropertyValues, setIssuePropertyValues] = useState<TIssuePropertyValues>({});
  const [issuePropertyValueErrors, setIssuePropertyValueErrors] = useState<TIssuePropertyValueErrors>({});
  // plane web hooks
  const { isEpicEnabledForProject, getIssueTypeById, getIssueTypeProperties, getProjectEpicId } = useIssueTypes();
  const { fetchPropertyActivities } = useIssuePropertiesActivity();
  // helpers
  const getIssueTypeIdOnProjectChange = (projectId: string) => {
    // get active issue types for the project
    const projectEpicId = getProjectEpicId(projectId);
    if (projectEpicId) return projectEpicId;
    // if no issue type available, return null
    return null;
  };

  const getActiveAdditionalPropertiesLength = (props: TActiveAdditionalPropertiesProps) => {
    const { projectId, workspaceSlug } = props;
    const issueTypeId = projectId ? getProjectEpicId(projectId) : null;
    // if issue type is not enabled for the project or no issue type id, return 0
    const isEpicEnabled = !!projectId && isEpicEnabledForProject(workspaceSlug, projectId);
    if (!isEpicEnabled || !issueTypeId) return 0;
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
    const isEpicEnabled = !!projectId && isEpicEnabledForProject(workspaceSlug, projectId);
    if (!isEpicEnabled) return true;
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
    return missingRequiredPropertyIds?.length === 0;
  };

  const handleCreateUpdatePropertyValues = async (props: TCreateUpdatePropertyValuesProps) => {
    const { workspaceSlug, projectId, issueTypeId, issueId } = props;
    // check if issue property values are empty
    if (Object.keys(issuePropertyValues).length === 0) return;
    // check if issue type display is enabled
    const isEpicEnabled = isEpicEnabledForProject(workspaceSlug, projectId);
    if (!isEpicEnabled) return;
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
    await epicPropertyValuesService
      .create(workspaceSlug, projectId, issueId, filteredIssuePropertyValues)
      .then(() => {
        // mutate issue property values
        mutate(`ISSUE_PROPERTY_VALUES_${workspaceSlug}_${projectId}_${issueId}_${isEpicEnabled}`);
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
        workItemTemplateId,
        setWorkItemTemplateId,
        isApplyingTemplate,
        setIsApplyingTemplate,
        selectedParentIssue,
        setSelectedParentIssue,
        issuePropertyValues,
        setIssuePropertyValues,
        issuePropertyValueErrors,
        setIssuePropertyValueErrors,
        getIssueTypeIdOnProjectChange,
        getActiveAdditionalPropertiesLength,
        handlePropertyValuesValidation,
        handleCreateUpdatePropertyValues,
        handleParentWorkItemDetails: () => Promise.resolve(undefined),
        handleProjectEntitiesFetch: () => Promise.resolve(),
        handleTemplateChange: () => Promise.resolve(),
      }}
    >
      {children}
    </IssueModalContext.Provider>
  );
});
