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

import React from "react";
import { InfoIcon } from "@plane/propel/icons";
// local imports
import { ModalFooter } from "../modal-footer";
import { NumberInputWithControls } from "../../common";

type TSelectSeatsStepProps = {
  error: string;
  handleClose: () => void;
  handleNextStep: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleSeatChange: (action: "increase" | "decrease") => void;
  isLoading: boolean;
  isOnTrial: boolean;
  isSelfHosted: boolean;
  numberOfSeats: string;
  onPreviousStep?: () => void;
  planeName: string;
  purchasedSeats: number;
  setError: (value: string) => void;
  setNumberOfSeats: (value: string) => void;
  subscriptionLevel: "instance" | "workspace";
};

export function SelectSeatsStep(props: TSelectSeatsStepProps) {
  const {
    error,
    handleClose,
    handleNextStep,
    handleSeatChange,
    isLoading,
    isOnTrial,
    isSelfHosted,
    numberOfSeats,
    onPreviousStep,
    planeName,
    purchasedSeats,
    setError,
    setNumberOfSeats,
    subscriptionLevel,
  } = props;

  return (
    <>
      <div className="space-y-4 p-5">
        <h5 className="text-h5-semibold text-primary">
          {subscriptionLevel === "instance"
            ? "Get more Admins, Members, and Guests in this instance."
            : "Get more Admins, Members, and Guests in this workspace."}
        </h5>
        <div className="flex items-center gap-1.5 text-body-sm-medium bg-accent-subtle text-accent-primary rounded-lg px-3 py-2">
          <InfoIcon className="size-4" />
          {subscriptionLevel === "instance"
            ? `Your ${planeName} plan, has ${purchasedSeats} seats for this instance.`
            : `Your current plan, ${planeName}
          ${isOnTrial ? " trial" : ""}, has ${purchasedSeats} seats for ${purchasedSeats} Admins + Members and${purchasedSeats * 5} Guests.`}
        </div>
        <div className="flex w-full items-center justify-between gap-1.5 border border-subtle-1 rounded-lg bg-layer-1 px-4 py-2">
          <div className="space-y-0.5">
            <div className="text-body-sm-semibold text-primary">
              {subscriptionLevel === "instance" ? "Add seats to your instance." : "Add seats to your workspace."}
            </div>
            <div className="text-caption-md-regular text-secondary">
              Each seat will be charged immediately per your plan.
              {!isOnTrial && (
                <>
                  <br /> You will see the final amount in the next step.
                </>
              )}
            </div>
          </div>
          <NumberInputWithControls
            value={numberOfSeats}
            onChange={setNumberOfSeats}
            error={error}
            setError={setError}
            handleSeatChange={handleSeatChange}
            isDecreaseDisabled={Number(numberOfSeats) <= 1}
            isIncreaseDisabled={Number(numberOfSeats) >= 10000}
          />
        </div>
        {isSelfHosted && (
          <div className="flex gap-1 items-center text-caption-md-regular text-tertiary">
            <InfoIcon className="size-3" />
            Ensure you are online and connected until you see a confirmation on this screen.
          </div>
        )}
      </div>
      <ModalFooter
        onPreviousStep={onPreviousStep}
        onClose={handleClose}
        onNext={handleNextStep}
        loading={isLoading}
        loadingText={isOnTrial ? "Confirming" : "Calculating price"}
        nextButtonText={isOnTrial ? "Confirm" : "Continue"}
      />
    </>
  );
}
