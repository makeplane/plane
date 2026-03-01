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

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane imports
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EProductSubscriptionEnum } from "@plane/types";
import type { IWorkspaceProductSubscription, TProrationPreview } from "@plane/types";
import { getSubscriptionName } from "@plane/utils";
// plane web imports
import { SelectSeatsStep, ConfirmPriceStep } from "./steps";
import { PaymentService } from "@/services/payment.service";

const paymentService = new PaymentService();

// Step type to track the modal state
type TModalStep = "SELECT_SEATS" | "CONFIRM_PRICE";

export type TMangeSeatSubscriptionDetails = Pick<
  IWorkspaceProductSubscription,
  "purchased_seats" | "is_self_managed" | "is_on_trial" | "product"
>;

type TAddSeatsFormProps = {
  getIsInTrialPeriod: (checkForUpgrade: boolean) => boolean;
  onClose?: () => void;
  onPreviousStep?: () => void;
  onSuccess?: () => void;
  subscribedPlan: TMangeSeatSubscriptionDetails;
  updateSubscribedPlan: (workspaceSlug: string, payload: Partial<IWorkspaceProductSubscription>) => void;
  workspaceSlug: string;
};

export const AddSeatsForm = observer(function AddSeatsForm(props: TAddSeatsFormProps) {
  const {
    getIsInTrialPeriod,
    onClose,
    onPreviousStep,
    onSuccess,
    subscribedPlan,
    updateSubscribedPlan,
    workspaceSlug,
  } = props;
  const {
    workspace: { mutateWorkspaceMembersActivity },
  } = useMember();
  // states
  const [currentStep, setCurrentStep] = useState<TModalStep>("SELECT_SEATS");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFetchingProrationPreview, setIsFetchingProrationPreview] = useState<boolean>(false);
  const [numberOfSeats, setNumberOfSeats] = useState<string>("1");
  const [prorationPreview, setProrationPreview] = useState<TProrationPreview | null>(null);
  const [error, setError] = useState<string>("");
  // derived values
  const isSelfHosted = subscribedPlan?.is_self_managed;
  const isOnTrial = getIsInTrialPeriod(false);
  const planeName = subscribedPlan?.product ? getSubscriptionName(subscribedPlan?.product) : "";
  const subscriptionLevel = subscribedPlan.product === EProductSubscriptionEnum.ENTERPRISE ? "instance" : "workspace";

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
    try {
      const response = await paymentService.updateWorkspaceSeats(workspaceSlug, updatedSeats);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Congratulations.",
        message: `Your workspace in now updated to ${response?.seats} seats.`,
      });
      updateSubscribedPlan(workspaceSlug, {
        purchased_seats: response?.seats,
      });
      void mutateWorkspaceMembersActivity(workspaceSlug);
      onSuccess?.();
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
        e.preventDefault();
        if (currentStep === "SELECT_SEATS") void handleNextStep(e);
        else void handleFormSubmit(e);
      }}
    >
      {currentStep === "SELECT_SEATS" ? (
        <SelectSeatsStep
          error={error}
          handleClose={handleClose}
          handleNextStep={(e) => void handleNextStep(e)}
          handleSeatChange={handleSeatChange}
          isLoading={isOnTrial ? isSubmitting : isFetchingProrationPreview}
          isOnTrial={isOnTrial}
          isSelfHosted={!!isSelfHosted}
          numberOfSeats={numberOfSeats}
          onPreviousStep={onPreviousStep ? handleOnPreviousStep : undefined}
          planeName={planeName}
          purchasedSeats={subscribedPlan?.purchased_seats || 0}
          setError={setError}
          setNumberOfSeats={setNumberOfSeats}
          subscriptionLevel={subscriptionLevel}
        />
      ) : (
        prorationPreview && (
          <ConfirmPriceStep
            handleClose={handleClose}
            handleFormSubmit={(e) => void handleFormSubmit(e)}
            isSubmitting={isSubmitting}
            onPreviousStep={() => setCurrentStep("SELECT_SEATS")}
            prorationPreview={prorationPreview}
            subscriptionLevel={subscriptionLevel}
          />
        )
      )}
    </form>
  );
});
