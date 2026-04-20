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

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { CustomerService } from "@plane/services";
import type { ISearchIssueResponse, TProjectIssuesSearchParams } from "@plane/types";
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
// plane web components
import { CustomerWorkItem, WorkItemEmptyState } from "@/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";
import type { TCustomerDetailPermissions } from "@/store/customers/permissions/root";

type TProps = {
  workspaceSlug: string;
  customerId: string;
  permissions: Pick<TCustomerDetailPermissions, "canLinkWorkItem" | "canUnlinkWorkItem">;
};

const customerService = new CustomerService();

export const WorkItemsList = observer(function WorkItemsList(props: TProps) {
  const { workspaceSlug, customerId, permissions } = props;
  // states
  const [workItemsModal, setWorkItemsModal] = useState<boolean>(false);
  // i18n
  const { t } = useTranslation();
  // hooks
  const {
    getCustomerWorkItemIds,
    workItems: { addWorkItemsToCustomer },
  } = useCustomers();
  // derived values
  const workItemIds = getCustomerWorkItemIds(customerId);
  const workItemsCount = workItemIds?.length || 0;

  const workItemSearchCallBack = (params: TProjectIssuesSearchParams) =>
    customerService.workItemsSearch(workspaceSlug, customerId, params);

  const handleAddWorkItems = async (data: ISearchIssueResponse[]) => {
    try {
      const _workItemIds = data.map((item) => item.id);
      await addWorkItemsToCustomer(workspaceSlug, customerId, _workItemIds);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("customers.toasts.work_item.add.success.title"),
        message: t("customers.toasts.work_item.add.success.message"),
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("customers.toasts.work_item.add.error.title"),
        message: error?.error || t("customers.toasts.work_item.add.error.title"),
      });
    }
  };

  return (
    <>
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        isOpen={workItemsModal}
        handleClose={() => setWorkItemsModal(false)}
        searchParams={{}}
        handleOnSubmit={handleAddWorkItems}
        workItemSearchServiceCallback={workItemSearchCallBack}
      />
      <div className="flex w-full items-center justify-between mb-4">
        <h3 className="text-18 font-medium">{t("common.work_items")}</h3>
        <div className="flex gap-2 items-center">
          {permissions.canLinkWorkItem && (
            <Button onClick={() => setWorkItemsModal(true)}>{t("customers.linked_work_items.link")}</Button>
          )}
        </div>
      </div>
      {workItemsCount === 0 ? (
        <WorkItemEmptyState linkWorkItem={() => setWorkItemsModal(true)} />
      ) : (
        workItemIds?.map((id) => (
          <CustomerWorkItem
            key={id}
            workspaceSlug={workspaceSlug}
            workItemId={id}
            customerId={customerId}
            isEditable={permissions.canUnlinkWorkItem}
          />
        ))
      )}
    </>
  );
});
