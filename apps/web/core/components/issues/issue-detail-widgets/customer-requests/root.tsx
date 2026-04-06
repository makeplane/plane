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
import { EntityDetailWidgetSection } from "@plane/blocks/entity-detail";
import { useTranslation } from "@plane/i18n";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web imports
import { useCustomers } from "@/plane-web/hooks/store";
// local imports
import { CustomerRequestActionButton } from "./quick-action-button";
import { WorkItemRequestCollapsibleContent } from "./content";

type Props = {
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
};

export const CustomerRequestsCollapsible = observer(function CustomerRequestsCollapsible(props: Props) {
  const { workspaceSlug, workItemId, disabled } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    openWidgets,
    toggleOpenWidget,
    issue: { getIssueById },
  } = useIssueDetail();
  const {
    workItems: { fetchWorkItemRequests },
  } = useCustomers();

  // derived values
  const isCollapsibleOpen = openWidgets.includes("customer_requests");
  const issue = getIssueById(workItemId);
  const customerRequestCount = issue?.customer_request_ids?.length ?? 0;

  useSWR(
    workspaceSlug && workItemId ? `WORK_ITEM_REQUESTS${workspaceSlug}_${workItemId}` : null,
    workspaceSlug && workItemId ? () => fetchWorkItemRequests(workspaceSlug.toString(), workItemId) : null,
    { revalidateIfStale: false, revalidateOnFocus: true }
  );

  return (
    <EntityDetailWidgetSection
      title={t("customers.requests.label", { count: 2 })}
      count={customerRequestCount}
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("customer_requests")}
      actionElement={
        !disabled ? (
          <CustomerRequestActionButton workspaceSlug={workspaceSlug} workItemId={workItemId} disabled={disabled} />
        ) : undefined
      }
    >
      <WorkItemRequestCollapsibleContent workItemId={workItemId} workspaceSlug={workspaceSlug} disabled={disabled} />
    </EntityDetailWidgetSection>
  );
});
