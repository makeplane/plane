import React, { FC } from "react";
// plane imports
import { observer } from "mobx-react";
// plane web imports
import { IssueAdditionalPropertyValuesUpdate } from "@/plane-web/components/issue-types";

export type TWorkItemAdditionalSidebarProperties = {
  workItemId: string;
  workItemType: string | null;
  projectId: string;
  workspaceSlug: string;
  isEditable: boolean;
  isPeekView?: boolean;
};

export const WorkItemAdditionalSidebarProperties: FC<TWorkItemAdditionalSidebarProperties> = observer((props) => {
  const { workItemId, projectId, workItemType, workspaceSlug, isEditable } = props;
  return (
    <>
      {workItemType && (
        <IssueAdditionalPropertyValuesUpdate
          issueId={workItemId}
          issueTypeId={workItemType}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
          isDisabled={!isEditable}
        />
      )}
    </>
  );
});
