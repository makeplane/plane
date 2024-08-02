"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
// plane web hooks
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";
// plane web services
import { IssuePropertyValuesService } from "@/plane-web/services/issue-types";
// plane web store
import { IIssueProperty } from "@/plane-web/store/issue-types";
// plane web types
import { EIssuePropertyType, TIssuePropertyValues } from "@/plane-web/types";
// local components
import { IssueAdditionalPropertyValues } from "./root";

type TIssueAdditionalPropertyValuesCreateProps = {
  issueId: string | undefined;
  issueTypeId: string;
  projectId: string;
  workspaceSlug: string;
  issuePropertyDefaultValues: TIssuePropertyValues;
  setIssuePropertyValues: React.Dispatch<React.SetStateAction<TIssuePropertyValues>>;
};

// helper function to get the default value for every property
const getPropertiesDefaultValues = (properties: IIssueProperty<EIssuePropertyType>[]): TIssuePropertyValues => {
  const defaultValues: TIssuePropertyValues = {};
  properties?.forEach((property) => {
    if (property.id && property.default_value) defaultValues[property.id] = property.default_value ?? [];
  });
  return defaultValues;
};

const issuePropertyValuesService = new IssuePropertyValuesService();

export const IssueAdditionalPropertyValuesCreate: React.FC<TIssueAdditionalPropertyValuesCreateProps> = observer((props) => {
  const {
    issueId,
    issueTypeId,
    projectId,
    workspaceSlug,
    issuePropertyDefaultValues,
    setIssuePropertyValues: handleIssuePropertyValueUpdate,
  } = props;
  // states
  const [issuePropertyValues, setIssuePropertyValues] = React.useState({});
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  // store hooks
  const { getAllTypesPropertiesOptions } = useIssueTypes();
  const issueType = useIssueType(issueTypeId);
  // derived values
  const issueTypeDetail = issueType?.asJSON;
  const activeProperties = issueType?.activeProperties;

  // fetch issue custom property values
  useEffect(() => {
    async function fetchIssuePropertyValues(issueId: string) {
      setIsLoading(true);
      await issuePropertyValuesService
        .fetchAll(workspaceSlug, projectId, issueId)
        .then((data) => {
          setIssuePropertyValues(data);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
    if (issueId) fetchIssuePropertyValues(issueId);
  }, [getAllTypesPropertiesOptions, issueId, projectId, workspaceSlug]);

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
        variant="create"
        isPropertyValuesLoading={isLoading}
        handlePropertyValueChange={handlePropertyValueChange}
      />
    </div>
  );
});
