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

import { useEffect } from "react";
import { observer } from "mobx-react";
import { usePathname, useSearchParams } from "next/navigation";
// plane imports
import { PlaneIcon } from "@plane/propel/icons";
import { EProductSubscriptionEnum } from "@plane/types";
import { getSubscriptionName } from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { SubscriptionButton } from "@/components/common/subscription/subscription-button";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const CloudEditionBadge = observer(function CloudEditionBadge() {
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // hooks
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    getIsInTrialPeriod,
    togglePaidPlanModal,
    handleSuccessModalToggle,
  } = useWorkspaceSubscription();
  // derived values
  const currentSubscription = subscriptionDetail?.product;
  const remainingTrialDays = subscriptionDetail?.remaining_trial_days;
  const showPaymentButton = !!subscriptionDetail?.show_payment_button;
  const isOnTrial = getIsInTrialPeriod(false);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success" && currentSubscription === EProductSubscriptionEnum.PRO) {
      router.replace(pathname);
      handleSuccessModalToggle(true);
    }
  }, [pathname, router, searchParams, currentSubscription, handleSuccessModalToggle]);

  const handlePaidPlanPurchaseModalOpen = () => {
    togglePaidPlanModal(true);
  };

  const handlePaidPlanSuccessModalOpen = () => {
    handleSuccessModalToggle(true);
  };

  const renderButtonText = () => {
    switch (currentSubscription) {
      case EProductSubscriptionEnum.FREE:
        return "Upgrade plan";
      case EProductSubscriptionEnum.PRO:
      case EProductSubscriptionEnum.BUSINESS:
      case EProductSubscriptionEnum.ENTERPRISE:
        return `${getSubscriptionName(currentSubscription)} trial ends
            ${remainingTrialDays === 0 ? "today" : `in ${remainingTrialDays}d`}
            `;
      default:
        return "Upgrade";
    }
  };

  if (!subscriptionDetail || !currentSubscription) return null;
  return (
    <div className="flex items-center gap-2 truncate flex-grow">
      {showPaymentButton && (
        <SubscriptionButton
          className="min-w-24"
          subscriptionType={currentSubscription}
          handleClick={handlePaidPlanPurchaseModalOpen}
          tooltipContent={renderButtonText()}
          showTooltip
        >
          <span className="truncate">{renderButtonText()}</span>
        </SubscriptionButton>
      )}
      {!showPaymentButton && (
        <SubscriptionButton subscriptionType={currentSubscription} handleClick={handlePaidPlanSuccessModalOpen}>
          {isOnTrial ? (
            `${getSubscriptionName(currentSubscription)} trial ends
            ${remainingTrialDays === 0 ? "today" : `in ${remainingTrialDays}d`}
            `
          ) : (
            <>
              <PlaneIcon className="size-4 flex-shrink-0" />
              <span className="truncate ">{getSubscriptionName(currentSubscription)}</span>
            </>
          )}
        </SubscriptionButton>
      )}
    </div>
  );
});
