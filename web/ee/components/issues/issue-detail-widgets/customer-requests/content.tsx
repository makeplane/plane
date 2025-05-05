import React, { FC, useEffect } from "react";
import { observer } from "mobx-react";
import { CustomerRequestSearchEmptyState } from "@/plane-web/components/customers";
import { WorkItemRequestListItem } from "@/plane-web/components/issues/issue-detail-widgets";
import { WorkItemRequestForm } from "@/plane-web/components/issues/issue-detail-widgets/customer-requests/form";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
  isTabs?: boolean;
};

export const WorkItemRequestCollapsibleContent: FC<TProps> = observer((props) => {
  const { workspaceSlug, workItemId, disabled, isTabs = false } = props;

  const {
    workItems: { getFilteredWorkItemRequestIds, workItemRequestSearchQuery },
    createUpdateRequestModalId,
    toggleCreateUpdateRequestModal,
  } = useCustomers();

  const handleFormClose = () => {
    toggleCreateUpdateRequestModal(null);
  };

  const requestIds = getFilteredWorkItemRequestIds(workItemId);

  useEffect(() => {
    toggleCreateUpdateRequestModal(null);
  }, []);

  return (
    <div className={`py-2 space-y-3 ${isTabs ? "" : "pl-9"}`}>
      <WorkItemRequestForm
        isOpen={createUpdateRequestModalId === workItemId}
        handleClose={handleFormClose}
        workspaceSlug={workspaceSlug}
        workItemId={workItemId}
      />
      {!requestIds?.length && workItemRequestSearchQuery !== "" && <CustomerRequestSearchEmptyState />}
      {requestIds.map((id) => (
        <WorkItemRequestListItem
          key={id}
          workspaceSlug={workspaceSlug}
          requestId={id}
          isEditable={!disabled}
          workItemId={workItemId}
        />
      ))}
    </div>
  );
});
