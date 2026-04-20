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
// plane web components
import { Loader } from "@plane/ui";
import { PageHead } from "@/components/core/page-title";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { LayoutRoot } from "@/components/common/layout";
import { CustomerDetailSidebar, CustomerEmptyState, CustomerMainRoot } from "@/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";
import type { TCustomerDetailPermissions } from "@/store/customers/permissions/root";

type TProps = {
  workspaceSlug: string;
  customerId: string;
};

export const CustomerDetailRoot = observer(function CustomerDetailRoot(props: TProps) {
  const { workspaceSlug, customerId } = props;

  // hooks
  const { currentWorkspace } = useWorkspace();
  const { fetchCustomerDetails, permissions: customerPermissions } = useCustomers();

  const { data: customer, isLoading } = useSWR(
    workspaceSlug && customerId ? `CUSTOMER_DETAIL_${workspaceSlug}_${customerId}` : null,
    workspaceSlug && customerId ? () => fetchCustomerDetails(workspaceSlug, customerId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // derived values
  const allPermissions: TCustomerDetailPermissions = {
    canEdit: customerPermissions.getCanEdit(workspaceSlug, customerId),
    canDelete: customerPermissions.getCanDelete(workspaceSlug, customerId),
    canEditProperty: (property) => customerPermissions.getCanEditProperty(workspaceSlug, customerId, property),
    canLinkWorkItem: customerPermissions.getCanLinkWorkItem(workspaceSlug, customerId),
    canUnlinkWorkItem: customerPermissions.getCanUnlinkWorkItem(workspaceSlug, customerId),
    canAddAttachment: customerPermissions.getCanAddAttachment(workspaceSlug),
    canDeleteAttachment: customerPermissions.getCanDeleteAttachment(workspaceSlug, customerId),
    requests: customerPermissions.getRequestPermissions(workspaceSlug, customerId),
  };

  const pageTitle =
    currentWorkspace?.name && customer?.name ? `${currentWorkspace.name} - ${customer.name}` : undefined;

  return isLoading ? (
    <Loader className="flex h-full gap-5 p-5">
      <div className="basis-2/3 space-y-2">
        <Loader.Item height="30px" width="40%" />
        <Loader.Item height="15px" width="60%" />
        <Loader.Item height="15px" width="60%" />
        <Loader.Item height="15px" width="40%" />
      </div>
      <div className="basis-1/3 space-y-3">
        <Loader.Item height="30px" />
        <Loader.Item height="30px" />
        <Loader.Item height="30px" />
        <Loader.Item height="30px" />
      </div>
    </Loader>
  ) : (
    <>
      <PageHead title={pageTitle} />
      <LayoutRoot
        renderEmptyState={!customer}
        emptyStateComponent={<CustomerEmptyState workspaceSlug={workspaceSlug} />}
      >
        <CustomerMainRoot customerId={customerId} workspaceSlug={workspaceSlug} permissions={allPermissions} />
        <CustomerDetailSidebar customerId={customerId} workspaceSlug={workspaceSlug} permissions={allPermissions} />
      </LayoutRoot>
    </>
  );
});
