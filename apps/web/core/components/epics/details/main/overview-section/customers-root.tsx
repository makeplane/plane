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

import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { Loader } from "@plane/ui";
// components
import { CustomerRequestEmptyState } from "@/components/customers";
import { WorkItemRequestCollapsibleContent } from "@/components/issues/issue-detail-widgets/customer-requests/content";
import { WorkItemRequestForm } from "@/components/issues/issue-detail-widgets/customer-requests/form";
// plane web imports
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  workspaceSlug: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicCustomersRoot = observer(function EpicCustomersRoot(props: TProps) {
  const { workspaceSlug, epicId, disabled = false } = props;
  // store hooks
  const {
    isCustomersFeatureEnabled,
    createUpdateRequestModalId,
    toggleCreateUpdateRequestModal,
    workItems: { fetchWorkItemRequests, getFilteredWorkItemRequestIds },
  } = useCustomers();

  const handleFormOpen = () => {
    toggleCreateUpdateRequestModal(epicId);
  };

  const handleFormClose = () => {
    toggleCreateUpdateRequestModal(null);
  };

  // derived values
  const requestIds = getFilteredWorkItemRequestIds(epicId);

  const { isLoading } = useSWR(
    workspaceSlug && epicId ? `WORK_ITEM_REQUESTS${workspaceSlug}_${epicId}` : null,
    workspaceSlug && epicId ? () => fetchWorkItemRequests(workspaceSlug.toString(), epicId) : null,
    { revalidateIfStale: false, revalidateOnFocus: true }
  );

  if (!isCustomersFeatureEnabled) return null;
  return (
    <>
      <WorkItemRequestForm
        isOpen={createUpdateRequestModalId === epicId}
        handleClose={handleFormClose}
        workspaceSlug={workspaceSlug}
        workItemId={epicId}
      />
      {isLoading ? (
        <>
          <Loader>
            <Loader.Item height="40px" />
          </Loader>
        </>
      ) : (
        requestIds.length === 0 && <CustomerRequestEmptyState addRequest={handleFormOpen} disabled={disabled} />
      )}
      <WorkItemRequestCollapsibleContent workItemId={epicId} workspaceSlug={workspaceSlug} />
    </>
  );
});
