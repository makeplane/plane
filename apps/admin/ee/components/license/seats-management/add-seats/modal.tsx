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

import { observer } from "mobx-react";
// plane imports
import type { TProductSubscription, TProrationPreview } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// local imports
import { AddSeatsForm } from "./form";
import type { TMangeSeatSubscriptionDetails } from "./form";

type TAddSeatsModalProps = {
  fetchProrationPreviewService: (quantity: number) => Promise<TProrationPreview>;
  getIsInTrialPeriod: (checkForUpgrade: boolean) => boolean;
  isOpen: boolean;
  onClose: () => void;
  subscriptionDetail: TMangeSeatSubscriptionDetails;
  subscriptionLevel: "workspace" | "instance";
  updateSeatsService: (quantity: number) => Promise<{ seats: number }>;
  updateSubscriptionDetail: (payload: Partial<TProductSubscription>) => void;
};

export const AddSeatsModal = observer(function AddSeatsModal(props: TAddSeatsModalProps) {
  const { isOpen, onClose } = props;

  if (!isOpen) return null;
  return (
    <ModalCore
      isOpen={isOpen}
      position={EModalPosition.TOP}
      width={EModalWidth.XXL}
      className="transition-all duration-300 ease-in-out"
    >
      <AddSeatsForm {...props} onSuccess={onClose} />
    </ModalCore>
  );
});
