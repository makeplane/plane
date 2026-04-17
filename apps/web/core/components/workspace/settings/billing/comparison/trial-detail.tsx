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
import { LoaderIcon } from "lucide-react";
import { Button } from "@plane/propel/button";
import type { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { cn, getSubscriptionName } from "@plane/utils";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TTrialDetailsProps = {
  subscriptionType: EProductSubscriptionEnum;
  trialLoader: EProductSubscriptionEnum | null;
  upgradeLoader: EProductSubscriptionEnum | null;
  isProductsAPILoading: boolean;
  handleTrial: (subscriptionType: EProductSubscriptionEnum) => void;
};

export const TrialDetails = observer(function TrialDetails(props: TTrialDetailsProps) {
  const { subscriptionType, trialLoader, upgradeLoader, isProductsAPILoading, handleTrial } = props;
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, getIsInTrialPeriod } = useWorkspaceSubscription();
  // derived values
  const planName = getSubscriptionName(subscriptionType);
  const currentSubscription = subscriptionDetail?.product;
  const isSelfManaged = !!subscriptionDetail?.is_self_managed;
  const isOfflinePayment = !!subscriptionDetail?.is_offline_payment;
  const isTrialAllowed = !!subscriptionDetail?.is_trial_allowed;
  const isOnTrialPeriod = getIsInTrialPeriod(false) && currentSubscription === subscriptionType;
  const isTrialEnded = !!subscriptionDetail?.is_trial_ended && currentSubscription === subscriptionType;

  if (isSelfManaged || isOfflinePayment) return null;
  if (!subscriptionDetail || isProductsAPILoading) return null;

  if (isTrialAllowed) {
    return (
      <Button
        variant="ghost"
        size="lg"
        onClick={() => handleTrial(subscriptionType)}
        className="w-full"
        disabled={!!trialLoader || !!upgradeLoader}
      >
        {trialLoader === subscriptionType && (
          <div className="w-3 h-3">
            <LoaderIcon size={12} className="animate-spin" />
          </div>
        )}
        <span>Start free trial</span>
      </Button>
    );
  }

  if (isOnTrialPeriod && subscriptionDetail) {
    return (
      <span
        className={cn("w-full py-1 text-center text-caption-sm-regular text-tertiary", {
          "text-danger-secondary": subscriptionDetail.show_trial_banner,
        })}
      >
        {planName} trial ends{" "}
        {subscriptionDetail.remaining_trial_days === 0 ? "today" : `in ${subscriptionDetail.remaining_trial_days} days`}
      </span>
    );
  }

  if (isTrialEnded) {
    return (
      <div className="w-full px-2 py-1 text-center text-caption-sm-regular text-danger-secondary">
        {planName} trial ended
      </div>
    );
  }

  return null;
});
