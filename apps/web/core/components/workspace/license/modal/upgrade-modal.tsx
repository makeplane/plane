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

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import type { TBillingFrequency } from "@plane/types";
import { EModalWidth, ModalCore } from "@plane/ui";
import { getSubscriptionName } from "@plane/utils";
// components
import { PlanUpgrade } from "@/components/workspace/settings/billing/comparison/plan-upgrade";

// plane web imports
import { useSelfHostedSubscription, useWorkspaceSubscription } from "@/plane-web/hooks/store";

import { Badge } from "@plane/propel/badge";

export type PaidPlanUpgradeModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const PaidPlanUpgradeModal = observer(function PaidPlanUpgradeModal(props: PaidPlanUpgradeModalProps) {
  const { isOpen, handleClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, getIsInTrialPeriod } = useWorkspaceSubscription();
  const { toggleLicenseActivationModal } = useSelfHostedSubscription();
  // states
  const [selectedFrequency, setSelectedFrequency] = useState<TBillingFrequency>("month");

  // derived values
  const isSelfHosted = subscriptionDetail?.is_self_managed;
  const isOnTrial = getIsInTrialPeriod(false);
  const currentPlan = subscriptionDetail?.product;
  const isTrialEnded = subscriptionDetail?.is_trial_ended;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.VXL} className="rounded-2xl">
      <div className="p-8 max-h-[90vh] overflow-auto">
        <PlanUpgrade
          workspaceSlug={workspaceSlug}
          selectedFrequency={selectedFrequency}
          setSelectedFrequency={setSelectedFrequency}
          heading={
            <div className="flex flex-col gap-2">
              {isOnTrial && currentPlan && (
                <div className="flex">
                  <Badge variant="brand">{`${getSubscriptionName(currentPlan)} trial`}</Badge>
                </div>
              )}
              {isTrialEnded && (
                <div className="flex">
                  <Badge variant="danger">Trial ended</Badge>
                </div>
              )}
              <h4 className="text-h4-semibold text-primary">Upgrade to a paid plan and unlock missing features.</h4>
              <p className="text-body-xs-regular text-secondary">
                Dashboards, Workflows, Approvals, Time Management, and other superpowers are just a click away. Upgrade
                today to unlock features your teams need yesterday.
              </p>
              {isSelfHosted && (
                <div className="flex gap-1 pt-1 text-secondary text-caption-md-medium">
                  Got a license?
                  <button
                    className="text-accent-primary hover:underline outline-none"
                    onClick={() => {
                      handleClose();
                      toggleLicenseActivationModal(true);
                    }}
                  >
                    Activate this workspace
                  </button>
                </div>
              )}
            </div>
          }
          className="mt-0 gap-y-6"
        />
      </div>
    </ModalCore>
  );
});
