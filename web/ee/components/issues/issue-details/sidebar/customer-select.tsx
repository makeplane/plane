import React, { FC } from "react";
import difference from "lodash/difference";
import { observer } from "mobx-react";
import { mutate } from "swr";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
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
  const { addWorkItemsToCustomer, removeWorkItemFromCustomer } = useCustomers();
  const { t } = useTranslation();

  const handleChange = (_value: string | string[]) => {
    // get the newly added customer id
    const addedCustomerIds = difference(_value, value || []);
    const removedCustomerIds = difference(value || [], _value);
    if (addedCustomerIds.length) {
      addWorkItemsToCustomer(workspaceSlug, addedCustomerIds[0], [workItemId]).catch((err) => {
        setToast({
          title: t("toast.error"),
          type: TOAST_TYPE.ERROR,
          message: t("customers.toasts.work_item.add.error.message"),
        });
      });
    }
    if (removedCustomerIds.length) {
      removeWorkItemFromCustomer(workspaceSlug, removedCustomerIds[0], workItemId).catch((err) => {
        setToast({
          title: t("toast.error"),
          type: TOAST_TYPE.ERROR,
          message: t("customers.toasts.work_item.remove.error.message"),
        });
      });
    }
  };

  return (
    <CustomerDropDown
      customButton={
        <Button variant="neutral-primary" size="sm" className="rounded-full p-1">
          {!compact && <span className="text-xs text-custom-text-200 px-1">Add customers</span>}
          <PlusIcon className="text-custom-text-300 size-3" />
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
