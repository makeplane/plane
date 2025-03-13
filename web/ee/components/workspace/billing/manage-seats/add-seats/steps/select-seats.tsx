import React from "react";
import { Info } from "lucide-react";
import { Dialog } from "@headlessui/react";
// plane web imports
import { ModalFooter } from "@/plane-web/components/workspace/billing/manage-seats/add-seats/modal-footer";
import { NumberInputWithControls } from "@/plane-web/components/workspace/billing/manage-seats/common";

type TSelectSeatsStepProps = {
  numberOfSeats: string;
  setNumberOfSeats: (value: string) => void;
  error: string;
  setError: (value: string) => void;
  handleSeatChange: (action: "increase" | "decrease") => void;
  isLoading: boolean;
  handleNextStep: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleClose: () => void;
  onPreviousStep?: () => void;
  planeName: string;
  purchasedSeats: number;
  isSelfHosted: boolean;
  isOnTrial: boolean;
};

export const SelectSeatsStep: React.FC<TSelectSeatsStepProps> = (props) => {
  const {
    numberOfSeats,
    setNumberOfSeats,
    error,
    setError,
    handleSeatChange,
    isLoading,
    handleNextStep,
    handleClose,
    onPreviousStep,
    planeName,
    purchasedSeats,
    isSelfHosted,
    isOnTrial,
  } = props;

  return (
    <>
      <div className="space-y-4 p-5">
        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
          Get more Admins, Members, and Guests in this workspace.
        </Dialog.Title>
        <div className="flex items-center gap-1.5 text-sm font-medium bg-custom-primary-100/10 text-custom-primary-200 rounded-md px-3 py-2">
          <Info className="size-4" />
          Your current plan, {planeName}
          {isOnTrial && " trial"}, has {purchasedSeats} seats for {purchasedSeats} Admins + Members and{" "}
          {purchasedSeats * 5} Guests.
        </div>
        <div className="flex w-full items-center justify-between gap-1.5 border border-custom-border-200 rounded-md bg-custom-background-90/70 px-4 py-2">
          <div>
            <div className="text-sm font-medium text-custom-text-100">Add seats to your workspace.</div>
            <div className="text-xs text-custom-text-200">
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
          <div className="flex gap-1 items-center text-xs text-custom-text-300">
            <Info className="size-3" />
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
};
