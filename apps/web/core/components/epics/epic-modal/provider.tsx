/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { mutate } from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { ISearchIssueResponse, TIssue, TIssuePropertyValueErrors, TIssuePropertyValues } from "@plane/types";
import { EIssueServiceType, EWorkItemConversionType, EWorkItemTypeEntity } from "@plane/types";
import { getPropertiesDefaultValues } from "@plane/utils";
// components
import type {
  TActiveAdditionalPropertiesProps,
  TCreateUpdatePropertyValuesProps,
  TPropertyValuesValidationProps,
} from "@/components/issues/issue-modal/context";
import { IssueModalContext } from "@/components/issues/issue-modal/context";
import { WorkItemConversionToastActionItem } from "@/components/common/toast-actions/work-item-conversion";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser } from "@/hooks/store/user/user-user";
// plane web components
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";
// plane web services
import { IssuePropertyValuesService } from "@/services/issue-types";

type TEpicModalProviderProps = {
  children: React.ReactNode;
};

const epicPropertyValuesService = new IssuePropertyValuesService(EIssueServiceType.EPICS);

export const EpicModalProvider = observer(function EpicModalProvider(props: TEpicModalProviderProps) {
  const { children } = props;
  // states
  const [workItemTemplateId, setWorkItemTemplateId] = useState<string | null>(null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);
  const [issuePropertyValues, setIssuePropertyValues] = useState<TIssuePropertyValues>({});
  const [issuePropertyValueErrors, setIssuePropertyValueErrors] = useState<TIssuePropertyValueErrors>({});
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { projectsWithCreatePermissions } = useUser();
  // plane web hooks
  const { isEpicEnabledForProject, getIssueTypeById, getIssueTypeProperties, getProjectEpicId, convertWorkItem } =
    useIssueTypes();
  const {
    activity: {
      issuePropertiesActivity: { fetchPropertyActivities },
    },
  } = useIssueDetail(EIssueServiceType.EPICS);

  // derived values
  const projectIdsWithCreatePermissions = Object.keys(projectsWithCreatePermissions ?? {});
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
        mutate(
          `ISSUE_PROPERTY_VALUES_${workspaceSlug}_${projectId}_${issueId}_${EWorkItemTypeEntity.EPIC}_${isEpicEnabled}`
        );
        // fetch property activities
        fetchPropertyActivities(workspaceSlug, projectId, issueId, "init-loader", EIssueServiceType.EPICS);
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

  /**
   * Used to handle work item conversion
   */
  const handleConvert = async (workspaceSlug: string, data: Partial<TIssue> | undefined) => {
    if (data?.id && data?.project_id) {
      await convertWorkItem(workspaceSlug.toString(), data.project_id, data?.id, EWorkItemConversionType.EPIC)
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("success"),
            message: "Work item converted to epic successfully",
            actionItems: <WorkItemConversionToastActionItem workspaceSlug={workspaceSlug} workItemId={data?.id} />,
          });
        })
        .catch((error) => {
          console.error(error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("error"),
            message: "Work item could not be converted to epic. Please try again.",
          });
          throw error;
        });
    }
  };

  return (
    <IssueModalContext.Provider
      value={{
        allowedProjectIds: projectIdsWithCreatePermissions,
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
        handleProjectEntitiesFetch: () => Promise.resolve(),
        handleTemplateChange: () => Promise.resolve(),
        handleConvert,
        handleCreateSubWorkItem: () => Promise.resolve(),
      }}
    >
      {children}
    </IssueModalContext.Provider>
  );
});
