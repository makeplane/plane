"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { mutate } from "swr";
import { CUSTOMER_TRACKER_EVENTS } from "@plane/constants";
import { TOAST_TYPE, setToast, AlertModalCore } from "@plane/ui";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useCustomers } from "@/plane-web/hooks/store";

type Props = {
  isModalOpen: boolean;
  customerId: string;
  requestId: string;
  handleClose: () => void;
  workItemId?: string;
};

export const DeleteCustomerRequestsModal: React.FC<Props> = observer((props) => {
  const { isModalOpen, customerId, requestId, handleClose, workItemId } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  // plane web hooks
  const { getRequestById, deleteCustomerRequest } = useCustomers();
  // derived values
  const request = getRequestById(requestId);

  const onSubmit = async () => {
    if (!customerId) return;
    setIsSubmitting(true);
    await deleteCustomerRequest(workspaceSlug.toString(), customerId, requestId, workItemId)
      .then(() => {
        handleClose();
        captureSuccess({
          eventName: CUSTOMER_TRACKER_EVENTS.delete_request,
          payload: {
            id: customerId,
            request_id: requestId,
          },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Customer request deleted successfully.",
        });
        mutate(`WORK_ITEM_CUSTOMERS${workspaceSlug}_${workItemId}`);
      })
      .catch((error) => {
        captureError({
          eventName: CUSTOMER_TRACKER_EVENTS.delete_request,
          payload: {
            id: customerId,
            request_id: requestId,
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
    <>
      <AlertModalCore
        handleClose={handleClose}
        handleSubmit={onSubmit}
        isSubmitting={isSubmitting}
        isOpen={isModalOpen}
        title={"Delete customer request?"}
        content={
          <>
            {/* TODO: Translate here */}
            Are you sure you want to delete this request{" "}
            <span className="break-words font-semibold">{request?.name}</span>? All of the data related to the customer
            will be permanently removed. This action cannot be undone.
          </>
        }
      />
    </>
  );
});
