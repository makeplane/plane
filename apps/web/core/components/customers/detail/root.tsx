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

import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane web components
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
import { Loader } from "@plane/ui";
import { PageHead } from "@/components/core/page-title";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { LayoutRoot } from "@/components/common/layout";
import { CustomerDetailSidebar, CustomerEmptyState, CustomerMainRoot } from "@/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";

export const CustomerDetailRoot = observer(function CustomerDetailRoot() {
  const { workspaceSlug, customerId } = useParams();

  // hooks
  const { currentWorkspace } = useWorkspace();
  const { fetchCustomerDetails } = useCustomers();
  const { allowPermissions } = useUserPermissions();

  const { data: customer, isLoading } = useSWR(
    workspaceSlug && customerId ? `CUSTOMER_DETAIL_${workspaceSlug}_${customerId}` : null,
    workspaceSlug && customerId ? () => fetchCustomerDetails(workspaceSlug.toString(), customerId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // derived values
  const isEditable = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);
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
        emptyStateComponent={<CustomerEmptyState workspaceSlug={workspaceSlug.toString()} />}
      >
        <CustomerMainRoot
          customerId={customerId.toString()}
          workspaceSlug={workspaceSlug.toString()}
          isEditable={isEditable}
        />
        <CustomerDetailSidebar
          customerId={customerId.toString()}
          workspaceSlug={workspaceSlug.toString()}
          isDisabled={!isEditable}
        />
      </LayoutRoot>
    </>
  );
});
