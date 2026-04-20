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
import { Loader } from "@plane/ui";
// plane web imports
import { useCustomers } from "@/plane-web/hooks/store";
import { SidebarCustomersList } from "./list";

type TWorkItemSidebarCustomerList = {
  workItemId: string;
  workspaceSlug: string;
  isPeekView?: boolean;
  canEdit: boolean;
};

export const WorkItemSidebarCustomers = observer(function WorkItemSidebarCustomers(
  props: TWorkItemSidebarCustomerList
) {
  const { workItemId, workspaceSlug, isPeekView = false, canEdit } = props;

  // hooks
  const {
    workItems: { fetchWorkItemCustomers },
  } = useCustomers();

  // fetch issue property values
  const { isLoading } = useSWR(
    workspaceSlug && workItemId ? `WORK_ITEM_CUSTOMERS${workspaceSlug}_${workItemId}` : null,
    () => (workspaceSlug && workItemId ? fetchWorkItemCustomers(workspaceSlug, workItemId) : null),
    {
      revalidateOnFocus: false,
    }
  );
  return (
    <>
      {isLoading ? (
        <Loader>
          <div className="flex gap-2">
            <Loader.Item width="40%" height="30px" />
            <Loader.Item width="60%" height="30px" />
          </div>
        </Loader>
      ) : (
        <SidebarCustomersList
          isPeekView={isPeekView}
          workspaceSlug={workspaceSlug}
          workItemId={workItemId}
          canEdit={canEdit}
        />
      )}
    </>
  );
});
