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
import { useParams } from "next/navigation";
// ui
import { mutate } from "swr";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore } from "@plane/ui";
// hooks
import { useCustomers } from "@/plane-web/hooks/store";

type Props = {
  isModalOpen: boolean;
  customerId: string;
  requestId: string;
  handleClose: () => void;
  workItemId?: string;
};

export const DeleteCustomerRequestsModal = observer(function DeleteCustomerRequestsModal(props: Props) {
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
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Customer request deleted successfully.",
        });
        mutate(`WORK_ITEM_CUSTOMERS${workspaceSlug}_${workItemId}`);
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
