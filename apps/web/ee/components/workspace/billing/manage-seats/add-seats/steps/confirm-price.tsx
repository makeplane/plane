import React from "react";
import { Dialog } from "@headlessui/react";
import { TProrationPreview } from "@plane/types";
// plane web imports
import { ModalFooter } from "@/plane-web/components/workspace/billing/manage-seats/add-seats/modal-footer";
import { FormCard, PriceRow } from "@/plane-web/components/workspace/billing/manage-seats/common";

type TConfirmPriceStepProps = {
  prorationPreview: TProrationPreview;
  handleFormSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isSubmitting: boolean;
  handleClose: () => void;
  onPreviousStep: () => void;
};

export const ConfirmPriceStep: React.FC<TConfirmPriceStepProps> = (props) => {
  const { prorationPreview, handleFormSubmit, isSubmitting, handleClose, onPreviousStep } = props;

  return (
    <>
      <div className="space-y-4 p-5">
        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
          Get more Admins, Members, and Guests in this workspace.
        </Dialog.Title>
        <div className="flex flex-col gap-4">
          <FormCard title="Confirm the addition of seats.">
            <PriceRow
              label="existing seats"
              quantity={prorationPreview.current_quantity}
              pricePerUnit={prorationPreview.current_price_amount}
              amount={prorationPreview.current_price_amount * prorationPreview.current_quantity}
              interval={prorationPreview.current_price_interval}
            />
            <PriceRow
              label="new seats"
              quantity={prorationPreview.quantity_difference}
              pricePerUnit={prorationPreview.current_price_amount}
              amount={prorationPreview.current_price_amount * prorationPreview.quantity_difference}
              interval={prorationPreview.current_price_interval}
            />
            <hr className="border-custom-border-200" />
            <PriceRow
              label={prorationPreview.current_price_interval === "MONTHLY" ? "Monthly total" : "Yearly total"}
              amount={
                (prorationPreview.quantity_difference + prorationPreview.current_quantity) *
                prorationPreview.current_price_amount
              }
              interval={prorationPreview.current_price_interval}
            />
          </FormCard>
          <FormCard title="Prorated seats for this billing cycle only">
            <PriceRow
              label="seats"
              quantity={prorationPreview.quantity_difference}
              pricePerUnit={prorationPreview.per_seat_prorated_amount}
              amount={prorationPreview.total_prorated_amount}
              interval={prorationPreview.current_price_interval}
              rightElement={<span className="text-xs text-custom-text-300">You will now be charged</span>}
            />
          </FormCard>
        </div>
      </div>
      <ModalFooter
        onPreviousStep={onPreviousStep}
        onClose={handleClose}
        onNext={handleFormSubmit}
        loading={isSubmitting}
        loadingText="Confirming"
        nextButtonText="Confirm changes"
      />
    </>
  );
};
