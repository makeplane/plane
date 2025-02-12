import { FC, useState } from "react";
import { useParams } from "next/navigation";
// ui
import { AlertModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web services
import { PaymentService } from "@/plane-web/services/payment.service";

const paymentService = new PaymentService();

type TRemoveUnusedSeatsProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const RemoveUnusedSeatsModal: FC<TRemoveUnusedSeatsProps> = (props) => {
  const { isOpen, handleClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // mobx store
  const { updateSubscribedPlan } = useWorkspaceSubscription();
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    paymentService
      .removeUnusedSeats(workspaceSlug?.toString())
      .then((response) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: `Your workspace in now updated to ${response?.seats} seats.`,
        });
        updateSubscribedPlan(workspaceSlug?.toString(), {
          purchased_seats: response?.seats,
        });
        handleClose();
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "We couldn't update seats.",
          message: err?.error || "Try again.",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (!isOpen) return null;
  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleSubmit}
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
};
