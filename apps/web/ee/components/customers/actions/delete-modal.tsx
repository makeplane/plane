"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
// ui
import { CUSTOMER_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, EModalWidth, EModalPosition, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useAppRouter } from "@/hooks/use-app-router";
import { useCustomers } from "@/plane-web/hooks/store";

type Props = {
  isModalOpen: boolean;
  customerId: string;
  handleClose: () => void;
};

export const DeleteCustomerModal: React.FC<Props> = observer((props) => {
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
        captureSuccess({
          eventName: CUSTOMER_TRACKER_EVENTS.delete_customer,
          payload: {
            id: customerId,
          },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Customer deleted successfully.",
        });
      })
      .catch((error) => {
        captureError({
          eventName: CUSTOMER_TRACKER_EVENTS.delete_customer,
          payload: {
            id: customerId,
          },
          error: error as Error,
        });
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
          <span className="place-items-center rounded-full bg-red-500/20 p-3">
            <AlertTriangle className="size-6 text-red-600" aria-hidden="true" />
          </span>
          <span className="flex items-center justify-start">
            <h3 className="text-lg font-medium xl:text-xl">
              {t("customers.delete.title", { customer_name: customer?.name })}
            </h3>
          </span>
        </div>
        <span>
          <p className="text-sm leading-5 text-custom-text-200">{t("customers.delete.description")}</p>
        </span>

        <div className="flex justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
