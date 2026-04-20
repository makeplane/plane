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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane web imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EProductSubscriptionEnum } from "@plane/types";
// components
import { PlanCard } from "@/components/workspace/license";
import { BillingButtons } from "@/components/workspace/settings/billing/billing-buttons";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// services
import { PaymentService } from "@/services/payment.service";

const paymentService = new PaymentService();

type ProPlanCardProps = {
  workspaceSlug: string;
  upgradeLoader: EProductSubscriptionEnum | null;
  handleUpgrade: (selectedSubscriptionType: EProductSubscriptionEnum) => void;
};

export const ProPlanCard = observer(function ProPlanCard(props: ProPlanCardProps) {
  const { workspaceSlug, upgradeLoader, handleUpgrade } = props;

  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // hooks
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,

    getIsInTrialPeriod,
  } = useWorkspaceSubscription();
  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;
  const isInTrialPeriod = getIsInTrialPeriod(true);

  useEffect(() => {
    setIsLoading(upgradeLoader === EProductSubscriptionEnum.PRO);
  }, [upgradeLoader]);

  const handleSubscriptionPageRedirection = async () => {
    setIsLoading(true);
    try {
      const response = await paymentService.getWorkspaceSubscriptionPageLink(workspaceSlug);
      if (response.url) window.open(response.url, "_blank");
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to redirect to subscription page. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSeats =
    !isSelfManaged && isInTrialPeriod
      ? () => handleUpgrade(EProductSubscriptionEnum.PRO)
      : handleSubscriptionPageRedirection;

  return (
    <PlanCard
      planVariant={EProductSubscriptionEnum.PRO}
      control={
        <BillingButtons
          workspaceSlug={workspaceSlug}
          planVariant={EProductSubscriptionEnum.PRO}
          isLoading={isLoading}
          handleManageSeats={handleManageSeats}
        />
      }
    />
  );
});
