"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
// ui
import { Button, EModalWidth, EModalPosition, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useCustomers } from "@/plane-web/hooks/store";
// plane web hooks

type Props = {
  isModalOpen: boolean;
  customerId: string;
  requestId: string;
  handleClose: () => void;
};

export const DeleteCustomerRequestsModal: React.FC<Props> = observer((props) => {
  const { isModalOpen, customerId, requestId, handleClose } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  // plane web hooks
  const { getRequestById, deleteCustomerRequest } = useCustomers();
  // derived values
  const customer = getRequestById(customerId, requestId);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customerId) return;
    setIsSubmitting(true);
    await deleteCustomerRequest(workspaceSlug.toString(), customerId, requestId)
      .then(() => {
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Customer request deleted successfully.",
        });
      })
      .catch(() => {
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
    <ModalCore isOpen={isModalOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 p-6">
        <div className="flex w-full items-center justify-start gap-4">
          <span className="place-items-center rounded-full bg-red-500/20 p-3">
            <AlertTriangle className="size-6 text-red-600" aria-hidden="true" />
          </span>
          <span className="flex items-center justify-start">
            <h3 className="text-xl font-medium 2xl:text-2xl">Delete customer request?</h3>
          </span>
        </div>
        <span>
          <p className="text-sm leading-5 text-custom-text-200">
            Are you sure you want to delete this request{" "}
            <span className="break-words font-semibold">{customer?.name}</span>? All of the data related to the customer
            will be permanently removed. This action cannot be undone.
          </p>
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
