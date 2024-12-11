"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { TIssueServiceType } from "@plane/types";
// ui
import { Loader } from "@plane/ui";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// plane web components
import { IssueAdditionalPropertyValuesCreate } from "@/plane-web/components/issue-types/";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

type TIssueAdditionalPropertiesProps = {
  issueId: string | undefined;
  issueTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  isDraft?: boolean;
  issueServiceType?: TIssueServiceType;
};

export const IssueAdditionalProperties: React.FC<TIssueAdditionalPropertiesProps> = observer((props) => {
  const {
    issueId,
    issueTypeId,
    projectId,
    workspaceSlug,
    isDraft = false,
    issueServiceType = EIssueServiceType.ISSUES,
  } = props;
  // store hooks
  const { issuePropertyValues, setIssuePropertyValues } = useIssueModal();
  const { isIssueTypeOrEpicEnabledForProject, getProjectIssuePropertiesLoader, fetchAllPropertiesAndOptions } =
    useIssueTypes();
  // derived values
  const isIssueTypeDisplayEnabled = isIssueTypeOrEpicEnabledForProject(
    workspaceSlug,
    projectId,
    "ISSUE_TYPE_DISPLAY",
    "EPICS_DISPLAY"
  );
  const issuePropertiesLoader = getProjectIssuePropertiesLoader(projectId);

  // This has to be on root level because of global level issue update, where we haven't fetch the details yet.
  useEffect(() => {
    if (projectId && isIssueTypeDisplayEnabled) {
      fetchAllPropertiesAndOptions(workspaceSlug?.toString(), projectId);
    }
  }, [fetchAllPropertiesAndOptions, isIssueTypeDisplayEnabled, projectId, workspaceSlug]);

  if (!issuePropertyValues || !setIssuePropertyValues) return;

  return (
    <>
      {isIssueTypeDisplayEnabled && (
        <>
          {issuePropertiesLoader === "init-loader" ? (
            <Loader className="space-y-4 py-2">
              <Loader.Item height="30px" />
              <Loader.Item height="30px" />
              <Loader.Item height="30px" width="50%" />
              <Loader.Item height="30px" width="50%" />
            </Loader>
          ) : (
            <>
              {issueTypeId && (
                <IssueAdditionalPropertyValuesCreate
                  issueId={issueId}
                  issueTypeId={issueTypeId}
                  projectId={projectId}
                  workspaceSlug={workspaceSlug}
                  isDraft={isDraft}
                  issueServiceType={issueServiceType}
                />
              )}
            </>
          )}
        </>
      )}
    </>
  );
});
