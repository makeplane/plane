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
import type { TProrationPreview } from "@plane/types";
// local imports
import { ModalFooter } from "../modal-footer";
import { FormCard, PriceRow } from "../../common";

type TConfirmPriceStepProps = {
  handleClose: () => void;
  handleFormSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isSubmitting: boolean;
  onPreviousStep: () => void;
  prorationPreview: TProrationPreview;
  subscriptionLevel: "workspace" | "instance";
};

export function ConfirmPriceStep(props: TConfirmPriceStepProps) {
  const { handleClose, handleFormSubmit, isSubmitting, onPreviousStep, prorationPreview, subscriptionLevel } = props;

  return (
    <>
      <div className="space-y-4 p-5">
        <h5 className="text-h5-semibold text-primary">
          {subscriptionLevel === "instance"
            ? "Get more Admins, Members, and Guests in this instance."
            : "Get more Admins, Members, and Guests in this workspace."}
        </h5>
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
            <hr className="border-subtle-1" />
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
              rightElement={<span className="text-11 text-tertiary">You will now be charged</span>}
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
}
