"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// ui
import { EIssueServiceType, EWorkItemTypeEntity, TIssuePropertyValues, TIssueServiceType } from "@plane/types";
import { Loader, setToast, TOAST_TYPE } from "@plane/ui";
// plane web components
import { IssueAdditionalPropertyValues } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssuePropertiesActivity, useIssueType, useIssueTypes } from "@/plane-web/hooks/store";
// plane web services
import { IssuePropertyValuesService } from "@/plane-web/services/issue-types";
// plane imports

type TIssueAdditionalPropertyValuesUpdateProps = {
  issueId: string;
  issueTypeId: string;
  projectId: string;
  workspaceSlug: string;
  isDisabled: boolean;
  issueServiceType?: TIssueServiceType;
  entityType?: EWorkItemTypeEntity;
};

export const IssueAdditionalPropertyValuesUpdate: React.FC<TIssueAdditionalPropertyValuesUpdateProps> = observer(
  (props) => {
    const {
      issueId,
      issueTypeId,
      projectId,
      workspaceSlug,
      isDisabled,
      entityType = EWorkItemTypeEntity.WORK_ITEM,
      issueServiceType = EIssueServiceType.ISSUES,
    } = props;
    // states
    const [issuePropertyValues, setIssuePropertyValues] = React.useState<TIssuePropertyValues>({});
    // store hooks
    const { isWorkItemTypeEntityEnabledForProject, getProjectWorkItemPropertiesLoader, fetchAllPropertiesAndOptions } =
      useIssueTypes();
    const issueType = useIssueType(issueTypeId);
    const { fetchPropertyActivities } = useIssuePropertiesActivity();
    // services
    const issuePropertyValuesService = new IssuePropertyValuesService(issueServiceType);
    // derived values
    const isWorkItemTypeEntityEnabled = isWorkItemTypeEntityEnabledForProject(
      workspaceSlug?.toString(),
      projectId,
      entityType
    );
    const issueTypeDetails = issueType?.asJSON;
    const activeProperties = issueType?.activeProperties;
    const propertiesLoader = getProjectWorkItemPropertiesLoader(projectId, entityType);
    // fetch methods
    async function fetchIssuePropertyValues() {
      // This is required when accessing the peek overview from workspace level.
      await fetchAllPropertiesAndOptions(workspaceSlug, projectId, entityType);
      return issuePropertyValuesService.fetchAll(workspaceSlug, projectId, issueId);
    }
    // fetch issue property values
    const { data, isLoading } = useSWR(
      workspaceSlug && projectId && issueId && entityType && isWorkItemTypeEntityEnabled
        ? `ISSUE_PROPERTY_VALUES_${workspaceSlug}_${projectId}_${issueId}_${entityType}_${isWorkItemTypeEntityEnabled}`
        : null,
      () =>
        workspaceSlug && projectId && issueId && entityType && isWorkItemTypeEntityEnabled
          ? fetchIssuePropertyValues()
          : null,
      {
        revalidateOnFocus: false,
      }
    );

    useEffect(() => {
      if (data) setIssuePropertyValues(data);
    }, [data]);

    const handlePropertyValueChange = async (propertyId: string, value: string[]) => {
      const beforeUpdateValue = issuePropertyValues[propertyId];
      setIssuePropertyValues((prev) => ({
        ...prev,
        [propertyId]: value,
      }));
      // update the property value
      await issuePropertyValuesService
        .update(workspaceSlug, projectId, issueId, propertyId, value)
        .then(async () => await fetchPropertyActivities(workspaceSlug, projectId, issueId))
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
    if (!isWorkItemTypeEntityEnabled) return <></>;

    if (propertiesLoader === "init-loader") {
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
        issueTypeId={issueTypeId}
        projectId={projectId}
        issuePropertyValues={issuePropertyValues}
        variant="update"
        isPropertyValuesLoading={isLoading}
        handlePropertyValueChange={handlePropertyValueChange}
        isDisabled={isDisabled}
      />
    );
  }
);
