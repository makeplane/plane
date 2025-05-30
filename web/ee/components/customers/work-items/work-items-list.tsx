import React, { FC, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel, EUserWorkspaceRoles } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CustomerService } from "@plane/services";
import { ISearchIssueResponse, TProjectIssuesSearchParams } from "@plane/types";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
import { ExistingIssuesListModal } from "@/components/core";
// plane web components
import { useUserPermissions } from "@/hooks/store";
import { CustomerWorkItem, WorkItemEmptyState } from "@/plane-web/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  workspaceSlug: string;
  customerId: string;
};

const customerService = new CustomerService();

export const WorkItemsList: FC<TProps> = observer((props) => {
  const { workspaceSlug, customerId } = props;
  // states
  const [workItemsModal, setWorkItemsModal] = useState<boolean>(false);
  // i18n
  const { t } = useTranslation();
  // hooks
  const { getCustomerWorkItemIds, workItems: {addWorkItemsToCustomer} } = useCustomers();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const workItemIds = getCustomerWorkItemIds(customerId);
  const workItemsCount = workItemIds?.length || 0;
  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const workItemSearchCallBack = (params: TProjectIssuesSearchParams) =>
    customerService.workItemsSearch(workspaceSlug, customerId, params);

  const handleAddWorkItems = async (data: ISearchIssueResponse[]) => {
    const _workItemIds = data.map((item) => item.id);
    await addWorkItemsToCustomer(workspaceSlug, customerId, _workItemIds)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("customers.toasts.work_item.add.success.title"),
          message: t("customers.toasts.work_item.add.success.message"),
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("customers.toasts.work_item.add.error.title"),
          message: error.error || t("customers.toasts.work_item.add.error.title"),
        });
      });
  };

  return (
    <>
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        isOpen={workItemsModal}
        handleClose={() => setWorkItemsModal(false)}
        searchParams={{}}
        handleOnSubmit={handleAddWorkItems}
        selectedWorkItems={[]}
        workItemSearchServiceCallback={workItemSearchCallBack}
      />
      <div className="flex w-full items-center justify-between mb-4">
        <h3 className="text-xl font-medium">{t("common.work_items")}</h3>
        <div className="flex gap-2 items-center">
          {isAdmin && (
            <Button onClick={() => setWorkItemsModal(true)} size="sm">
              {t("customers.linked_work_items.link")}
            </Button>
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
            isEditable={isAdmin}
          />
        ))
      )}
    </>
  );
});
