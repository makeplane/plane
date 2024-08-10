"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
// hooks
import { Loader } from "@plane/ui";
import { useProject } from "@/hooks/store";
// plane web components
import { IssueAdditionalPropertyValuesCreate } from "@/plane-web/components/issue-types/";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";
// plane web types
import { TIssuePropertyValueErrors, TIssuePropertyValues } from "@/plane-web/types";

type TIssueAdditionalPropertiesProps = {
  issueId: string | undefined;
  issueTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  issuePropertyValues?: TIssuePropertyValues;
  issuePropertyValueErrors?: TIssuePropertyValueErrors;
  setIssuePropertyValues?: React.Dispatch<React.SetStateAction<TIssuePropertyValues>>;
};

export const IssueAdditionalProperties: React.FC<TIssueAdditionalPropertiesProps> = observer((props) => {
  const {
    issueId,
    issueTypeId,
    projectId,
    workspaceSlug,
    issuePropertyValues,
    issuePropertyValueErrors,
    setIssuePropertyValues,
  } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { getProjectIssuePropertiesLoader, fetchAllPropertiesAndOptions } = useIssueTypes();
  // derived values
  const projectDetails = getProjectById(projectId);
  const issuePropertiesLoader = getProjectIssuePropertiesLoader(projectId);

  // This has to be on root level because of global level issue update, where we haven't fetch the details yet.
  useEffect(() => {
    if (projectId) {
      fetchAllPropertiesAndOptions(workspaceSlug?.toString(), projectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (!issuePropertyValues || !setIssuePropertyValues) return;

  return (
    <>
      {projectDetails?.is_issue_type_enabled && (
        <>
          {!issueTypeId || issuePropertiesLoader === "init-loader" ? (
            <Loader className="space-y-4 py-2">
              <Loader.Item height="30px" />
              <Loader.Item height="30px" />
              <Loader.Item height="30px" width="50%" />
              <Loader.Item height="30px" width="50%" />
            </Loader>
          ) : (
            <IssueAdditionalPropertyValuesCreate
              issueId={issueId}
              issueTypeId={issueTypeId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              issuePropertyDefaultValues={issuePropertyValues}
              issuePropertyValueErrors={issuePropertyValueErrors}
              setIssuePropertyValues={setIssuePropertyValues}
            />
          )}
        </>
      )}
    </>
  );
});
