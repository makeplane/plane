"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Dialog } from "@headlessui/react";
// ui
import { Button, EModalPosition, EModalWidth, Input, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import selfHostedSubscriptionService from "@/plane-web/services/self-hosted-subscription.service";
// types

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
  const [numberOfSeats, setNumberOfSeats] = useState<number>(1);
  // mobx store
  const { currentWorkspaceSubscribedPlanDetail: subscribedPlan } = useWorkspaceSubscription();

  const handleClose = () => {
    onClose();

    const timeout = setTimeout(() => {
      setNumberOfSeats(1);
      clearTimeout(timeout);
    }, 350);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await selfHostedSubscriptionService
      .updateWorkspaceSeats(workspaceSlug?.toString(), numberOfSeats)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Seats added successfully",
          message: "You have successfully added seats to your workspace",
        });
        handleClose();
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: err.error,
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
        <div className="space-y-5">
          <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
            Add more seats
          </Dialog.Title>
          <p className="text-sm text-custom-text-200">
            You are only allowed to add <b>{subscribedPlan?.purchased_seats}</b> Admin/ Member and{" "}
            <b>{(subscribedPlan?.purchased_seats || 0) * 5}</b> Guest/ Viewers. Please add more seats to continue.
          </p>
          <div className="mb-3 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-custom-text-200">Number of seats: </span>
              <Input
                id="number_of_seats"
                type="number"
                value={numberOfSeats}
                onChange={(e) => setNumberOfSeats(Number(e.target.value))}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="Add number of seats"
                inputSize="xs"
              />
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
