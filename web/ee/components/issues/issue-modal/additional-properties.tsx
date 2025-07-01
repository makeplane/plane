"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType, EWorkItemTypeEntity } from "@plane/types";
// ui
import { Loader } from "@plane/ui";
// ce imports
import { TIssueAdditionalPropertiesProps } from "@/ce/components/issues/issue-modal/additional-properties";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// plane web components
import { IssueAdditionalPropertyValuesCreate } from "@/plane-web/components/issue-types/";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

export const IssueAdditionalProperties: React.FC<TIssueAdditionalPropertiesProps> = observer((props) => {
  const {
    issueId,
    issueTypeId,
    projectId,
    workspaceSlug,
    entityType = EWorkItemTypeEntity.WORK_ITEM,
    isDraft = false,
    issueServiceType = EIssueServiceType.ISSUES,
  } = props;
  // store hooks
  const { issuePropertyValues, setIssuePropertyValues } = useIssueModal();
  const { isWorkItemTypeEntityEnabledForProject, getProjectWorkItemPropertiesLoader, fetchAllPropertiesAndOptions } =
    useIssueTypes();
  // derived values
  const isWorkItemTypeEntityEnabled = isWorkItemTypeEntityEnabledForProject(workspaceSlug, projectId, entityType);
  const propertiesLoader = getProjectWorkItemPropertiesLoader(projectId, entityType);

  // This has to be on root level because of global level issue update, where we haven't fetch the details yet.
  useEffect(() => {
    if (projectId && isWorkItemTypeEntityEnabled) {
      fetchAllPropertiesAndOptions(workspaceSlug?.toString(), projectId, entityType);
    }
  }, [fetchAllPropertiesAndOptions, isWorkItemTypeEntityEnabled, projectId, workspaceSlug, entityType]);

  if (!issuePropertyValues || !setIssuePropertyValues) return;

  return (
    <>
      {isWorkItemTypeEntityEnabled && issueTypeId && (
        <>
          {propertiesLoader === "init-loader" ? (
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
              entityType={entityType}
              isDraft={isDraft}
              issueServiceType={issueServiceType}
            />
          )}
        </>
      )}
    </>
  );
});
