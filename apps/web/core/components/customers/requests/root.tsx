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
// plane web imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import {
  CustomerRequestEmptyState,
  CustomerRequestForm,
  CustomerRequestListItem,
  CustomerRequestSearch,
  CustomerRequestSearchEmptyState,
} from "@/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";
import type { TCustomerDetailPermissions } from "@/store/customers/permissions/root";

type TProps = {
  workspaceSlug: string;
  customerId: string;
  permissions: TCustomerDetailPermissions["requests"];
};

export const CustomerRequestsRoot = observer(function CustomerRequestsRoot(props: TProps) {
  const { workspaceSlug, customerId, permissions } = props;

  // i18n
  const { t } = useTranslation();
  // hooks
  const {
    getFilteredCustomerRequestIds,
    customerRequestSearchQuery,
    createUpdateRequestModalId,
    toggleCreateUpdateRequestModal,
  } = useCustomers();

  // derived values
  const requestIds = getFilteredCustomerRequestIds(customerId);
  const isRequestFormOpen = createUpdateRequestModalId === customerId;

  const handleFormClose = () => {
    toggleCreateUpdateRequestModal(null);
  };

  const handleFormOpen = () => {
    toggleCreateUpdateRequestModal(customerId);
  };

  useEffect(() => {
    toggleCreateUpdateRequestModal(null);
  }, []);

  return (
    <>
      {/* Header */}
      <div className="flex justify-between pb-4 items-center">
        <h3 className="text-18 text-h3-semibold">{t("customers.requests.label", { count: 2 })}</h3>
        <div className="flex gap-2 items-center">
          <CustomerRequestSearch />
          {permissions.canCreate && (
            <Button onClick={handleFormOpen} disabled={isRequestFormOpen} className="px-2 py-1">
              {t("customers.requests.add")}
            </Button>
          )}
        </div>
      </div>
      {!requestIds?.length &&
        (customerRequestSearchQuery === "" ? (
          <CustomerRequestEmptyState addRequest={handleFormOpen} />
        ) : (
          <CustomerRequestSearchEmptyState />
        ))}
      <CustomerRequestForm
        isOpen={isRequestFormOpen}
        handleClose={handleFormClose}
        workspaceSlug={workspaceSlug}
        customerId={customerId}
      />
      {/* Customer Request List */}
      <div className="space-y-3 pb-5">
        {requestIds &&
          requestIds.map((id) => (
            <CustomerRequestListItem
              workspaceSlug={workspaceSlug}
              requestId={id}
              customerId={customerId}
              key={id}
              permissions={{
                canCreate: permissions.canCreate,
                canEdit: permissions.getCanEdit(id),
                canDelete: permissions.getCanDelete(id),
                canAddAttachment: permissions.getCanAddAttachment(id),
                canDeleteAttachment: permissions.getCanDeleteAttachment(id),
              }}
            />
          ))}
      </div>
    </>
  );
});
