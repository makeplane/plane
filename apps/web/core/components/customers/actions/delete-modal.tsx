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

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
// ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalWidth, EModalPosition, ModalCore } from "@plane/ui";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useCustomers } from "@/plane-web/hooks/store";

type Props = {
  isModalOpen: boolean;
  customerId: string;
  handleClose: () => void;
};

export const DeleteCustomerModal = observer(function DeleteCustomerModal(props: Props) {
  const { isModalOpen, customerId, handleClose } = props;
  // i18n
  const { t } = useTranslation(); // router
  const router = useAppRouter();
  const { workspaceSlug, customerId: customerIdParam } = useParams();
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  // plane web hooks
  const { getCustomerById, deleteCustomer } = useCustomers();
  // derived values
  const customer = getCustomerById(customerId);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customerId) return;
    setIsSubmitting(true);
    await deleteCustomer(workspaceSlug.toString(), customerId)
      .then(() => {
        if (customerIdParam) {
          router.push(`/${workspaceSlug}/customers`);
        }
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Customer deleted successfully.",
        });
      })
      .catch((_error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again later.",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <ModalCore isOpen={isModalOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 p-6">
        <div className="flex w-full items-center justify-start gap-4">
          <span className="place-items-center rounded-full bg-danger-subtle p-3">
            <AlertTriangle className="size-6 text-danger-primary" aria-hidden="true" />
          </span>
          <span className="flex items-center justify-start">
            <h3 className="text-16 font-medium xl:text-18">
              {t("customers.delete.title", { customer_name: customer?.name })}
            </h3>
          </span>
        </div>
        <span>
          <p className="text-13 leading-5 text-secondary">{t("customers.delete.description")}</p>
        </span>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="error-fill" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
