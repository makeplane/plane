"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { TProrationPreview } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { getSubscriptionName } from "@plane/utils";
// plane web imports
import {
  SelectSeatsStep,
  ConfirmPriceStep,
} from "@/plane-web/components/workspace/billing/manage-seats/add-seats/steps";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { PaymentService } from "@/plane-web/services/payment.service";

const paymentService = new PaymentService();

// Step type to track the modal state
type TModalStep = "SELECT_SEATS" | "CONFIRM_PRICE";

type TAddSeatsFormProps = {
  onClose?: () => void;
  onPreviousStep?: () => void;
};

export const AddSeatsForm: React.FC<TAddSeatsFormProps> = observer((props) => {
  const { onClose, onPreviousStep } = props;
  // router
  const { workspaceSlug } = useParams();
  // mobx store
  const { currentWorkspaceSubscribedPlanDetail: subscribedPlan, updateSubscribedPlan } = useWorkspaceSubscription();
  // states
  const [currentStep, setCurrentStep] = useState<TModalStep>("SELECT_SEATS");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFetchingProrationPreview, setIsFetchingProrationPreview] = useState<boolean>(false);
  const [numberOfSeats, setNumberOfSeats] = useState<string>("1");
  const [prorationPreview, setProrationPreview] = useState<TProrationPreview | null>(null);
  const [error, setError] = useState<string>("");
  // derived values
  const isSelfHosted = subscribedPlan?.is_self_managed;
  const isOnTrial = subscribedPlan?.is_on_trial;
  const planeName = subscribedPlan?.product ? getSubscriptionName(subscribedPlan?.product) : "";

  useEffect(() => {
    if (error) setError("");
  }, [error, numberOfSeats]);

  // handlers
  const resetForm = () => {
    const timeout = setTimeout(() => {
      setNumberOfSeats("1");
      setError("");
      setProrationPreview(null);
      setCurrentStep("SELECT_SEATS");
      clearTimeout(timeout);
    }, 350);
  };

  const handleClose = () => {
    onClose?.();
    resetForm();
  };

  const handleOnPreviousStep = () => {
    onPreviousStep?.();
    resetForm();
  };

  const fetchProrationPreview = async () => {
    const numberOfSeatsToAdd = Number(numberOfSeats);
    if (isNaN(numberOfSeatsToAdd) || numberOfSeatsToAdd <= 0) return;

    setIsFetchingProrationPreview(true);
    try {
      const response = await paymentService.fetchProrationPreview(workspaceSlug?.toString(), numberOfSeatsToAdd);
      setProrationPreview(response);
      setCurrentStep("CONFIRM_PRICE");
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error fetching price",
        message: "Try again.",
      });
    } finally {
      setIsFetchingProrationPreview(false);
    }
  };

  const handleNextStep = async (e: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // validate purchased seats
    if (!subscribedPlan?.purchased_seats) return;
    // validate number of seats
    if (!numberOfSeats || Number(numberOfSeats) <= 0) {
      setError("You need to add at least one seat.");
      return;
    }
    if (isNaN(Number(numberOfSeats)) || Number(numberOfSeats) > 10000) {
      setError("We take a number from 1 to 10,000 here.");
      return;
    }
    // If the workspace is on trial, we don't need to fetch the proration preview
    if (isOnTrial) {
      await handleFormSubmit(e);
    } else {
      await fetchProrationPreview();
    }
  };

  const handleFormSubmit = async (e: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // validate purchased seats
    if (!subscribedPlan?.purchased_seats) return;

    const purchasedSeats = subscribedPlan?.purchased_seats;
    const updatedSeats = purchasedSeats + Number(numberOfSeats);

    setIsSubmitting(true);
    await paymentService
      .updateWorkspaceSeats(workspaceSlug?.toString(), updatedSeats)
      .then((response) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Congratulations.",
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

  const handleSeatChange = (action: "increase" | "decrease") => {
    if (isNaN(Number(numberOfSeats))) {
      setNumberOfSeats("1");
      return;
    }
    if (action === "increase") {
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
    <form
      onSubmit={(e) => {
        if (currentStep === "SELECT_SEATS") handleNextStep(e);
        else handleFormSubmit(e);
      }}
      onKeyDown={(e) => {
        if (e.code === "Enter") e.preventDefault();
      }}
    >
      {currentStep === "SELECT_SEATS" ? (
        <SelectSeatsStep
          numberOfSeats={numberOfSeats}
          setNumberOfSeats={setNumberOfSeats}
          error={error}
          setError={setError}
          handleSeatChange={handleSeatChange}
          isLoading={!!isOnTrial ? isSubmitting : isFetchingProrationPreview}
          handleNextStep={handleNextStep}
          handleClose={handleClose}
          onPreviousStep={onPreviousStep ? handleOnPreviousStep : undefined}
          planeName={planeName}
          purchasedSeats={subscribedPlan?.purchased_seats || 0}
          isSelfHosted={!!isSelfHosted}
          isOnTrial={!!isOnTrial}
        />
      ) : (
        prorationPreview && (
          <ConfirmPriceStep
            prorationPreview={prorationPreview}
            handleFormSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            handleClose={handleClose}
            onPreviousStep={() => setCurrentStep("SELECT_SEATS")}
          />
        )
      )}
    </form>
  );
});
