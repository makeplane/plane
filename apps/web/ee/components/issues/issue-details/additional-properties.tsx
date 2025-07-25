import React, { FC } from "react";
// plane imports
import { observer } from "mobx-react";
// plane web imports
import { TWorkItemAdditionalSidebarProperties } from "@/ce/components/issues/issue-details/additional-properties";
import { IssueAdditionalPropertyValuesUpdate } from "@/plane-web/components/issue-types/values/addition-properties-update";
import { WorkItemSidebarCustomers } from "@/plane-web/components/issues/issue-details/sidebar/customer-list-root";
import { useCustomers } from "@/plane-web/hooks/store";

export const WorkItemAdditionalSidebarProperties: FC<TWorkItemAdditionalSidebarProperties> = observer((props) => {
  const { workItemId, projectId, workItemTypeId, workspaceSlug, isEditable, isPeekView = false } = props;
  const { isCustomersFeatureEnabled } = useCustomers();
  return (
    <>
      {isCustomersFeatureEnabled && (
        <WorkItemSidebarCustomers workItemId={workItemId} workspaceSlug={workspaceSlug} isPeekView={isPeekView} />
      )}
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
