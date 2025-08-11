import React, { FC } from "react";
import difference from "lodash/difference";
import { observer } from "mobx-react";
import { mutate } from "swr";
import { PlusIcon } from "lucide-react";
// plane imports
import { CUSTOMER_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, CustomersIcon, setToast, TOAST_TYPE } from "@plane/ui";
// plane web imports
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { CustomerDropDown } from "@/plane-web/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";
type TProps = {
  workItemId: string;
  value: string[] | null;
  workspaceSlug: string;
  compact?: boolean;
};

export const CustomerSelect: FC<TProps> = observer((props) => {
  const { workItemId, value, workspaceSlug, compact = false } = props;
  // hooks
  const {
    workItems: { addWorkItemsToCustomer, removeWorkItemFromCustomer },
  } = useCustomers();
  const { t } = useTranslation();
  const handleChange = async (_value: string | string[]) => {
    // get the newly added customer id
    const addedCustomerIds = difference(_value, value || []);
    const removedCustomerIds = difference(value || [], _value);
    if (addedCustomerIds.length) {
      addWorkItemsToCustomer(workspaceSlug, addedCustomerIds[0], [workItemId])
        .then(() => {
          captureSuccess({
            eventName: CUSTOMER_TRACKER_EVENTS.add_work_items_to_customer,
            payload: {
              id: addedCustomerIds[0],
              work_item_ids: [workItemId],
            },
          });
        })
        .catch((error) => {
          captureError({
            eventName: CUSTOMER_TRACKER_EVENTS.add_work_items_to_customer,
            payload: {
              id: addedCustomerIds[0],
              work_item_ids: [workItemId],
            },
            error: error as Error,
          });
          setToast({
            title: t("toast.error"),
            type: TOAST_TYPE.ERROR,
            message: t("customers.toasts.work_item.add.error.message"),
          });
        });
    }
    if (removedCustomerIds.length) {
      await removeWorkItemFromCustomer(workspaceSlug, removedCustomerIds[0], workItemId)
        .then(() => {
          captureSuccess({
            eventName: CUSTOMER_TRACKER_EVENTS.remove_work_items_from_customer,
            payload: {
              id: removedCustomerIds[0],
              work_item_ids: [workItemId],
            },
          });
        })
        .catch((error) => {
          captureError({
            eventName: CUSTOMER_TRACKER_EVENTS.remove_work_items_from_customer,
            payload: {
              id: removedCustomerIds[0],
              work_item_ids: [workItemId],
            },
            error: error as Error,
          });
          setToast({
            title: t("toast.error"),
            type: TOAST_TYPE.ERROR,
            message: t("customers.toasts.work_item.remove.error.message"),
          });
        });
      mutate(`WORK_ITEM_REQUESTS${workspaceSlug}_${workItemId}`);
    }
  };

  return (
    <CustomerDropDown
      customButton={
        <Button variant="neutral-primary" size="sm" className="rounded-full p-0 border-custom-border-100">
          {compact ? (
            <div className="p-1">
              <PlusIcon className="text-custom-text-300 size-2.5" />
            </div>
          ) : (
            <div className="flex gap-2 px-2 py-0.5 items-center">
              <CustomersIcon className="text-custom-text-300 size-2" />
              <span className="text-xs text-custom-text-300">{t("customers.dropdown.placeholder")}</span>
            </div>
          )}
        </Button>
      }
      customButtonClassName="hover:bg-transparent"
      value={value || []}
      multiple
      onChange={handleChange}
      disabled={false}
    />
  );
});
