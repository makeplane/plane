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

import { difference } from "lodash-es";
import { observer } from "mobx-react";
import { mutate } from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { cn } from "@plane/utils";
// plane web imports
import { CustomerDropDown } from "@/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  customButtonClassName?: string;
  workItemId: string;
  value: string[] | null;
  workspaceSlug: string;
  disabled?: boolean;
};

export const CustomerSelect = observer(function CustomerSelect(props: TProps) {
  const { workItemId, value, workspaceSlug, customButtonClassName, disabled = false } = props;
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
      addWorkItemsToCustomer(workspaceSlug, addedCustomerIds[0], [workItemId]).catch(() => {
        setToast({
          title: t("toast.error"),
          type: TOAST_TYPE.ERROR,
          message: t("customers.toasts.work_item.add.error.message"),
        });
      });
    }
    if (removedCustomerIds.length) {
      await removeWorkItemFromCustomer(workspaceSlug, removedCustomerIds[0], workItemId).catch(() => {
        setToast({
          title: t("toast.error"),
          type: TOAST_TYPE.ERROR,
          message: t("customers.toasts.work_item.remove.error.message"),
        });
      });
      await mutate(`WORK_ITEM_REQUESTS${workspaceSlug}_${workItemId}`);
    }
  };

  return (
    <CustomerDropDown
      customButton={
        <button
          type="button"
          className={cn(
            "w-full rounded-sm px-2 py-0.5 bg-layer-transparent hover:bg-layer-transparent-hover text-body-xs-regular text-placeholder",
            customButtonClassName
          )}
        >
          {t("customers.dropdown.placeholder")}
        </button>
      }
      className="w-full"
      customButtonClassName="hover:bg-transparent"
      value={value || []}
      multiple
      onChange={handleChange}
      disabled={disabled}
    />
  );
});
