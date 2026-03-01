/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { CustomerRequestSearchEmptyState } from "@/components/customers";
// components
import { WorkItemRequestListItem } from "@/components/issues/issue-detail-widgets/customer-requests/request-list-item";
import { WorkItemRequestForm } from "@/components/issues/issue-detail-widgets/customer-requests/form";
// hooks
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
  isTabs?: boolean;
};

export const WorkItemRequestCollapsibleContent = observer(function WorkItemRequestCollapsibleContent(props: TProps) {
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
