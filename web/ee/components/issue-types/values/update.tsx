"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { Loader, setToast, TOAST_TYPE } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store";
// plane web components
import { IssueAdditionalPropertyValues } from "@/plane-web/components/issue-types";
// plane web hooks
import { useFlag, useIssueType, useIssueTypes } from "@/plane-web/hooks/store";
// plane web services
import { IssuePropertyValuesService } from "@/plane-web/services/issue-types";
// plane web types
import { TIssuePropertyValues } from "@/plane-web/types";

type TIssueAdditionalPropertyValuesUpdateProps = {
  issueId: string;
  issueTypeId: string;
  projectId: string;
  workspaceSlug: string;
};

const issuePropertyValuesService = new IssuePropertyValuesService();

export const IssueAdditionalPropertyValuesUpdate: React.FC<TIssueAdditionalPropertyValuesUpdateProps> = observer(
  (props) => {
    const { issueId, issueTypeId, projectId, workspaceSlug } = props;
    // states
    const [issuePropertyValues, setIssuePropertyValues] = React.useState<TIssuePropertyValues>({});
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    // store hooks
    const { getProjectIssuePropertiesLoader, fetchAllPropertiesAndOptions } = useIssueTypes();
    const issueType = useIssueType(issueTypeId);
    const { getProjectById } = useProject();
    // derived values
    const isIssueTypeDisplayEnabled = useFlag(workspaceSlug?.toString(), "ISSUE_TYPE_DISPLAY");
    const projectDetails = getProjectById(projectId);
    const issueTypeDetails = issueType?.asJSON;
    const activeProperties = issueType?.activeProperties;
    const issueProperties = getProjectIssuePropertiesLoader(projectId);
    const isIssueTypeEnabled = isIssueTypeDisplayEnabled && projectDetails?.is_issue_type_enabled;

    // fetch issue custom property values
    useEffect(() => {
      async function fetchIssuePropertyValues() {
        setIsLoading(true);
        // This is required when accessing the peek overview from workspace level.
        await fetchAllPropertiesAndOptions(workspaceSlug, projectId);
        await issuePropertyValuesService
          .fetchAll(workspaceSlug, projectId, issueId)
          .then((data) => {
            setIssuePropertyValues(data);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
      if (isIssueTypeEnabled) fetchIssuePropertyValues();
    }, [fetchAllPropertiesAndOptions, isIssueTypeEnabled, issueId, projectId, workspaceSlug]);

    const handlePropertyValueChange = async (propertyId: string, value: string[]) => {
      const beforeUpdateValue = issuePropertyValues[propertyId];
      setIssuePropertyValues((prev) => ({
        ...prev,
        [propertyId]: value,
      }));
      // update the property value
      await issuePropertyValuesService
        .update(workspaceSlug, projectId, issueId, propertyId, value)
        .then(() => {
          // TODO: remove
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Property update successfully.",
          });
        })
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
    if (!isIssueTypeEnabled) return null;

    if (issueProperties === "init-loader") {
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
      />
    );
  }
);
