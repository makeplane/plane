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
import type { IWorkspaceProductSubscription, TAddWorkspaceSeatsModal } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// local imports
import { AddSeatsForm } from "./form";
import type { TMangeSeatSubscriptionDetails } from "./form";

type TAddSeatsModalProps = {
  data: TAddWorkspaceSeatsModal;
  getIsInTrialPeriod: (checkForUpgrade: boolean) => boolean;
  onClose: () => void;
  subscribedPlan: TMangeSeatSubscriptionDetails;
  updateSubscribedPlan: (workspaceSlug: string, payload: Partial<IWorkspaceProductSubscription>) => void;
  workspaceSlug: string;
};

export const AddSeatsModal = observer(function AddSeatsModal(props: TAddSeatsModalProps) {
  const { data, getIsInTrialPeriod, onClose, subscribedPlan, updateSubscribedPlan, workspaceSlug } = props;

  if (!data.isOpen) return null;
  return (
    <ModalCore
      isOpen={data.isOpen}
      position={EModalPosition.TOP}
      width={EModalWidth.XXL}
      className="transition-all duration-300 ease-in-out"
    >
      <AddSeatsForm
        getIsInTrialPeriod={getIsInTrialPeriod}
        onClose={onClose}
        onSuccess={onClose}
        subscribedPlan={subscribedPlan}
        updateSubscribedPlan={updateSubscribedPlan}
        workspaceSlug={workspaceSlug}
      />
    </ModalCore>
  );
});
