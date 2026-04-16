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

import { useParams } from "next/navigation";
// plane imports
import { EModalWidth, ModalCore } from "@plane/ui";
// components
import { PlanUpgrade } from "@/components/workspace/settings/billing/comparison/plan-upgrade";

export type PaidPlanUpgradeModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const PaidPlanUpgradeModal = function PaidPlanUpgradeModal(props: PaidPlanUpgradeModalProps) {
  const { isOpen, handleClose } = props;
  // router
  const { workspaceSlug } = useParams();

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.VXL} className="rounded-2xl">
      <div className="p-10 max-h-[90vh] overflow-auto">
        <PlanUpgrade
          workspaceSlug={workspaceSlug}
          heading={
            <div className="flex flex-col gap-2">
              <h6 className="text-h4-semibold">Upgrade to a paid plan and unlock missing features.</h6>
              <p className="text-body-xs-regular text-secondary">
                Dashboards, Workflows, Approvals, Time Management, and other superpowers are just a click away. Upgrade
                today to unlock features your teams need yesterday.
              </p>
            </div>
          }
          className="mt-0 gap-y-6"
        />
      </div>
    </ModalCore>
  );
};
