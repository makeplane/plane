import React, { FC } from "react";
// plane imports
import { observer } from "mobx-react";
// plane web imports
import { IssueAdditionalPropertyValuesUpdate } from "@/plane-web/components/issue-types";

export type TWorkItemAdditionalSidebarProperties = {
  workItemId: string;
  workItemTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  isEditable: boolean;
  isPeekView?: boolean;
};

export const WorkItemAdditionalSidebarProperties: FC<TWorkItemAdditionalSidebarProperties> = observer((props) => {
  const { workItemId, projectId, workItemTypeId, workspaceSlug, isEditable } = props;
  return (
    <>
      {workItemTypeId && (
        <IssueAdditionalPropertyValuesUpdate
          issueId={workItemId}
          issueTypeId={workItemTypeId}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
          isDisabled={!isEditable}
        />
      )}
    </>
  );
});
