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
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { IWorkspaceProductSubscription } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
// plane web imports
import { PaymentService } from "@/services/payment.service";
import { useMember } from "@/hooks/store/use-member";

const paymentService = new PaymentService();

type TRemoveUnusedSeatsProps = {
  isOpen: boolean;
  handleClose: () => void;
  workspaceSlug: string;
  updateSubscribedPlan: (workspaceSlug: string, payload: Partial<IWorkspaceProductSubscription>) => void;
};

export function RemoveUnusedSeatsModal(props: TRemoveUnusedSeatsProps) {
  const { isOpen, handleClose, updateSubscribedPlan, workspaceSlug } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  // store hooks
  const {
    workspace: { mutateWorkspaceMembersActivity },
  } = useMember();

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const response = await paymentService.removeUnusedSeats(workspaceSlug?.toString());

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: `Your workspace in now updated to ${response?.seats} seats.`,
      });
      updateSubscribedPlan(workspaceSlug, {
        purchased_seats: response?.seats,
      });
      void mutateWorkspaceMembersActivity(workspaceSlug);
      handleClose();
    } catch (err) {
      const errorMessage =
        err && typeof err === "object" && "error" in err && typeof err.error === "string" ? err.error : "Try again.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "We couldn't update seats.",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={() => void handleSubmit()}
      isSubmitting={isSubmitting}
      isOpen={isOpen}
      title="Remove unused seats?"
      content="If you are adding Admins or Members to this workspace so they can participate in projects, keep your seats instead of removing them. Remove them only if you are sure you don’t need to add anyone to your workspace."
      secondaryButtonText="Keep my seats"
      primaryButtonText={{
        loading: "Confirming",
        default: "Remove them",
      }}
    />
  );
}
