"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Dialog } from "@headlessui/react";
// ui
import { Button, EModalPosition, EModalWidth, Input, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web services
import selfHostedSubscriptionService from "@/plane-web/services/self-hosted-subscription.service";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const UpdateWorkspaceSeatsModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [numberOfSeats, setNumberOfSeats] = useState<string>("1");
  const [error, setError] = useState<string>("");
  // mobx store
  const { currentWorkspaceSubscribedPlanDetail: subscribedPlan, updateSubscribedPlan } = useWorkspaceSubscription();

  const handleClose = () => {
    onClose();

    const timeout = setTimeout(() => {
      setNumberOfSeats("1");
      clearTimeout(timeout);
    }, 350);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // validate number of seats
    if (!numberOfSeats) {
      setError("Number of seats is required");
      return;
    }
    if (isNaN(Number(numberOfSeats))) {
      setError("Number of seats must be a number");
      return;
    }
    if (Number(numberOfSeats) <= 0) {
      setError("Number of seats must be greater than 0");
      return;
    }

    setIsSubmitting(true);
    await selfHostedSubscriptionService
      .updateWorkspaceSeats(workspaceSlug?.toString(), Number(numberOfSeats))
      .then((response) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Seats added successfully",
          message: "You have successfully added seats to your workspace",
        });
        updateSubscribedPlan(workspaceSlug?.toString(), {
          purchased_seats: response?.seats,
        });
        handleClose();
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Request failed",
          message: err?.error || "Something went wrong",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form
        onSubmit={handleFormSubmit}
        onKeyDown={(e) => {
          if (e.code === "Enter") e.preventDefault();
        }}
        className="p-5"
      >
        <div className="space-y-2">
          <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
            Add more seats
          </Dialog.Title>
          <p className="text-sm text-custom-text-200">
            Your current plan allows for <b>{subscribedPlan?.purchased_seats}</b> Admin/Member seats and{" "}
            <b>{(subscribedPlan?.purchased_seats || 0) * 5}</b> Guest/Viewer seats. To accommodate more users, please
            increase your seat allocation.
          </p>
          <div className="py-4 space-y-1">
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-custom-text-200 pt-1">Additional seats to purchase: </span>
              <div className="flex flex-col w-full gap-0.5">
                <Input
                  id="number_of_seats"
                  type="number"
                  value={numberOfSeats}
                  onChange={(e) => {
                    if (Boolean(error)) setError("");
                    setNumberOfSeats(e.target.value);
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="Add number of seats"
                  inputSize="xs"
                  hasError={Boolean(error)}
                />
                {Boolean(error) && <p className="text-xs text-red-500">{error}</p>}
                <p className="text-xs text-custom-text-200">
                  This action will update your current plan, and you&apos;ll be billed for the additional seats. Please
                  ensure you have an active internet connection to connect with our billing services.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Adding seats" : "Add seats"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
