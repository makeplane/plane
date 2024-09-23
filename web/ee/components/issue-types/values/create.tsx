"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// helpers
import { getPropertiesDefaultValues } from "@/plane-web/helpers/issue-properties.helper";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";
// plane web services
import { IssuePropertyValuesService } from "@/plane-web/services/issue-types";
// local components
import { IssueAdditionalPropertyValues } from "./root";

type TIssueAdditionalPropertyValuesCreateProps = {
  issueId: string | undefined;
  issueTypeId: string;
  projectId: string;
  workspaceSlug: string;
};

const issuePropertyValuesService = new IssuePropertyValuesService();

export const IssueAdditionalPropertyValuesCreate: React.FC<TIssueAdditionalPropertyValuesCreateProps> = observer(
  (props) => {
    const { issueId, issueTypeId, projectId, workspaceSlug } = props;
    // states
    const [issuePropertyValues, setIssuePropertyValues] = React.useState({});
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    // store hooks
    const {
      issuePropertyValues: issuePropertyDefaultValues,
      issuePropertyValueErrors,
      setIssuePropertyValues: handleIssuePropertyValueUpdate,
    } = useIssueModal();
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
    }, [issueId, projectId, workspaceSlug]);

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
