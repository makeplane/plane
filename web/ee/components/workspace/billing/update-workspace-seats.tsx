"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Info, Minus, Plus } from "lucide-react";
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

type TUpdateSeatButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
};

const UpdateSeatButton: React.FC<TUpdateSeatButtonProps> = (props) => {
  const { children, onClick } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center size-7 bg-custom-background-90 hover:bg-custom-background-80 rounded cursor-pointer select-none"
    >
      {children}
    </button>
  );
};

export const UpdateWorkspaceSeatsModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // mobx store
  const { currentWorkspaceSubscribedPlanDetail: subscribedPlan, updateSubscribedPlan } = useWorkspaceSubscription();
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [numberOfSeats, setNumberOfSeats] = useState<string>(subscribedPlan?.purchased_seats?.toString() || "1");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (error) setError("");
  }, [numberOfSeats]);

  const handleClose = () => {
    onClose();

    const timeout = setTimeout(() => {
      setNumberOfSeats(subscribedPlan?.purchased_seats?.toString() || "1");
      setError("");
      clearTimeout(timeout);
    }, 350);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // validate number of seats
    if (!numberOfSeats || Number(numberOfSeats) <= 0) {
      setError("You need to add at least one seat.");
      return;
    }
    if (isNaN(Number(numberOfSeats)) || Number(numberOfSeats) > 10000) {
      setError("We take a number from 1 to 10,000 here.");
      return;
    }

    setIsSubmitting(true);
    await selfHostedSubscriptionService
      .updateWorkspaceSeats(workspaceSlug?.toString(), Number(numberOfSeats))
      .then((response) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Congratulations.",
          message: `Your workspace in now update to ${response?.seats} seats.`,
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

  const handleSeatChange = (action: "add" | "remove") => {
    if (isNaN(Number(numberOfSeats))) {
      setNumberOfSeats("1");
      return;
    }
    if (action === "add") {
      setNumberOfSeats((prev) => {
        const newSeats = Number(prev) + 1;
        return newSeats > 10000 ? "10000" : newSeats.toString();
      });
    } else {
      setNumberOfSeats((prev) => {
        const newSeats = Number(prev) - 1;
        return newSeats < 1 ? "1" : newSeats.toString();
      });
    }
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
            Manage seats on your current plan
          </Dialog.Title>
          <p className="text-sm text-custom-text-200">
            Your current plan lets you have{" "}
            <span className="text-custom-text-100 font-medium">
              {subscribedPlan?.purchased_seats} Admins or Members
            </span>{" "}
            and{" "}
            <span className="text-custom-text-100 font-medium">
              {(subscribedPlan?.purchased_seats || 0) * 5} Guests
            </span>
            .
          </p>
          <div className="py-2 space-y-4">
            <div className="flex w-full items-center gap-1.5">
              <div className="text-sm text-custom-text-200 pr-2">Number of paid seats</div>
              <UpdateSeatButton onClick={() => handleSeatChange("remove")}>
                <Minus className="size-4 text-custom-text-100" />
              </UpdateSeatButton>
              <Input
                id="number_of_seats"
                type="text"
                value={numberOfSeats}
                onChange={(e) => {
                  if (Boolean(error)) setError("");
                  if (!isNaN(Number(e.target.value))) setNumberOfSeats(e.target.value);
                }}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="Seats"
                className="w-14 text-right"
                inputSize="xs"
                hasError={Boolean(error)}
                tabIndex={-1}
              />
              <UpdateSeatButton onClick={() => handleSeatChange("add")}>
                <Plus className="size-4 text-custom-text-100" />
              </UpdateSeatButton>
              {Boolean(error) && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex gap-1.5 py-2 px-3 rounded bg-custom-primary-100/10 text-xs text-custom-text-200">
              <div className="flex-shirk-0">
                <Info className="size-3 mt-0.5" />
              </div>
              <div>
                <p>Ensure you are online and connected until this goes through successfully.</p>
                <p>We will charge your card on file for the additional seats.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Confirming" : "Change"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
