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
import { EProductSubscriptionTier } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IPaymentProduct } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";
import { Loader } from "@plane/ui";
import { getSubscriptionName } from "@plane/utils";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

const COMMON_BUTTON_STYLE = "w-full transition-all duration-300 animate-slide-up";

type TSubscriptionButtonProps = {
  subscriptionType: EProductSubscriptionEnum;
  isProductsAPILoading: boolean;
  currentProduct: IPaymentProduct | undefined;
  upgradeLoader: EProductSubscriptionEnum | null;
  handleSubscriptionUpgrade: (subscriptionType: EProductSubscriptionEnum) => void;
};

export const SubscriptionButton = observer(function SubscriptionButton(props: TSubscriptionButtonProps) {
  const { subscriptionType, isProductsAPILoading, currentProduct, upgradeLoader, handleSubscriptionUpgrade } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, getIsInTrialPeriod } = useWorkspaceSubscription();
  // derived values
  const currentPlan = subscriptionDetail?.product ?? EProductSubscriptionEnum.FREE;
  const subscriptionName = getSubscriptionName(subscriptionType);
  const isOnTrialPeriod = getIsInTrialPeriod(true);
  const isOfflinePayment = !!subscriptionDetail?.is_offline_payment;
  const showCurrentSubscriptionButton = currentPlan === subscriptionType && !isOnTrialPeriod;
  const isHigherTierPlan = EProductSubscriptionTier[subscriptionType] >= EProductSubscriptionTier[currentPlan];
  // If the workspace is on trial, allow upgrade if the user has not added a payment method
  // Else, allow upgrade if the current plan is a higher tier than the subscription type
  const showUpgradeButton = subscriptionDetail?.is_on_trial
    ? !subscriptionDetail?.has_added_payment_method
    : isHigherTierPlan && currentPlan !== subscriptionType;

  if (!subscriptionDetail || isProductsAPILoading) {
    return (
      <Loader className="w-full h-full">
        <Loader.Item height="30px" width="100%" />
      </Loader>
    );
  }

  if (showCurrentSubscriptionButton) {
    return (
      <Button variant="secondary" size="lg" className={COMMON_BUTTON_STYLE} disabled>
        Current plan
      </Button>
    );
  }

  if (showUpgradeButton) {
    const getButtonText = () => {
      if (!currentProduct?.is_active) {
        return t("common.upgrade_cta.talk_to_sales");
      }
      if (isOfflinePayment) {
        return t("message_support");
      }
      if (upgradeLoader === subscriptionType) {
        return "Redirecting to Stripe";
      }
      return `Upgrade to ${subscriptionName}`;
    };

    return (
      <Button
        variant="primary"
        size="lg"
        onClick={() => handleSubscriptionUpgrade(subscriptionType)}
        className={COMMON_BUTTON_STYLE}
        disabled={!!upgradeLoader}
      >
        {getButtonText()}
      </Button>
    );
  }

  return null;
});
