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
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web imports
import { useCustomers } from "@/plane-web/hooks/store";
// local imports
import { CustomerRequestsCollapsibleTitle } from "./title";
import { WorkItemRequestCollapsibleContent } from "./content";

type TProps = {
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
};

export const CustomerRequestsCollapsible = observer(function CustomerRequestsCollapsible(props: TProps) {
  const { workspaceSlug, workItemId, disabled } = props;
  // store hooks
  const { openWidgets, toggleOpenWidget } = useIssueDetail();
  const {
    workItems: { fetchWorkItemRequests },
  } = useCustomers();

  // derived values
  const isCollapsibleOpen = openWidgets.includes("customer_requests");

  useSWR(
    workspaceSlug && workItemId ? `WORK_ITEM_REQUESTS${workspaceSlug}_${workItemId}` : null,
    workspaceSlug && workItemId ? () => fetchWorkItemRequests(workspaceSlug.toString(), workItemId) : null,
    { revalidateIfStale: false, revalidateOnFocus: true }
  );

  return (
    <Collapsible
      open={isCollapsibleOpen}
      onOpenChange={(open) => {
        if (open !== isCollapsibleOpen) {
          toggleOpenWidget("customer_requests");
        }
      }}
    >
      <CollapsibleTrigger className="w-full">
        <CustomerRequestsCollapsibleTitle
          workspaceSlug={workspaceSlug}
          isOpen={isCollapsibleOpen}
          workItemId={workItemId}
          disabled={disabled}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <WorkItemRequestCollapsibleContent workItemId={workItemId} workspaceSlug={workspaceSlug} disabled={disabled} />
      </CollapsibleContent>
    </Collapsible>
  );
});
