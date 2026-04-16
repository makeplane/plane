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
import { SUBSCRIPTION_WITH_TRIAL } from "@plane/constants";
import type { IPaymentProduct, TBillingFrequency, TUpgradeParams } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";
import { Loader } from "@plane/ui";
import {
  cn,
  getSubscriptionName,
  getSubscriptionPriceDetails,
  getSubscriptionProduct,
  getSubscriptionProductPrice,
  getSubscriptionProductStatus,
} from "@plane/utils";
// constants
import type { TPlanDetail } from "@/constants/plans";
// plane web
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// local imports
import { SubscriptionButton } from "./subscription-button";
import { TrialDetails } from "./trial-detail";

type TPlanDetailProps = {
  subscriptionType: EProductSubscriptionEnum;
  planDetail: TPlanDetail;
  products: IPaymentProduct[] | undefined;
  isProductsAPILoading: boolean;
  upgradeLoader: EProductSubscriptionEnum | null;
  trialLoader: EProductSubscriptionEnum | null;
  billingFrequency: TBillingFrequency | undefined;
  handleUpgrade: (upgradeParams: TUpgradeParams) => void;
  handleTrial: (trialParams: TUpgradeParams) => void;
  isHorizontalView?: boolean;
};

export const PlanDetail = observer(function PlanDetail(props: TPlanDetailProps) {
  const {
    subscriptionType,
    planDetail,
    products,
    isProductsAPILoading,
    upgradeLoader,
    trialLoader,
    billingFrequency,
    handleTrial,
    handleUpgrade,
    isHorizontalView = false,
  } = props;
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, getIsInTrialPeriod } = useWorkspaceSubscription();

  // subscription details
  const subscriptionName = getSubscriptionName(subscriptionType);
  const isSelfHosted = !!subscriptionDetail?.is_self_managed;
  const canStartTrial = !!subscriptionDetail?.is_trial_allowed;
  const isInTrial = getIsInTrialPeriod(false);
  const hasTrialEnded = !!subscriptionDetail?.is_trial_ended;
  const shouldShowTrialDetails = !isSelfHosted && (canStartTrial || isInTrial || hasTrialEnded);

  // pricing details
  const subscriptionProduct = getSubscriptionProduct(products, subscriptionType);
  const isSubscriptionActive = getSubscriptionProductStatus(subscriptionType, subscriptionProduct);
  const pricingDetails = getSubscriptionPriceDetails(subscriptionProduct);
  const activePricingDetails =
    billingFrequency === "month" ? pricingDetails.monthlyPriceDetails : pricingDetails.yearlyPriceDetails;

  const defaultPrice = billingFrequency === "month" ? planDetail.monthlyPrice : planDetail.yearlyPrice;
  const displayPrice = activePricingDetails.price ?? defaultPrice;
  const pricingDescription = isSubscriptionActive ? "per user per month" : "Quote on request";

  /**
   * Handles plan upgrade process
   * @param {EProductSubscriptionEnum} planType - Type of plan to upgrade to
   */
  const handlePlanUpgrade = (planType: EProductSubscriptionEnum) => {
    const selectedPlanPrice = getSubscriptionProductPrice(
      subscriptionProduct,
      planType === EProductSubscriptionEnum.ONE ? undefined : billingFrequency
    );

    handleUpgrade({
      selectedSubscriptionType: planType,
      selectedProductId: subscriptionProduct?.id,
      selectedPriceId: selectedPlanPrice?.id,
      isActive: isSubscriptionActive,
    });
  };

  /**
   * Handles starting a trial period
   * @param {EProductSubscriptionEnum} planType - Type of plan to start trial for
   */
  const handleTrialStart = (planType: EProductSubscriptionEnum) => {
    const selectedPlanPrice = getSubscriptionProductPrice(
      subscriptionProduct,
      planType === EProductSubscriptionEnum.ONE ? undefined : billingFrequency
    );

    handleTrial({
      selectedSubscriptionType: planType,
      selectedProductId: subscriptionProduct?.id,
      selectedPriceId: selectedPlanPrice?.id,
      isActive: isSubscriptionActive,
    });
  };

  return (
    <div
      className={cn(
        "col-span-1 px-6 py-4",
        isHorizontalView
          ? "flex w-full min-w-0 flex-row flex-wrap items-center justify-between gap-4"
          : "flex flex-col justify-between gap-4"
      )}
    >
      {/* Plan name and pricing section */}
      <div className="flex flex-col gap-2">
        <div className="text-h6-medium">
          <span>{subscriptionName}</span>
        </div>
        {isProductsAPILoading ? (
          <Loader className="w-full h-full">
            <Loader.Item height="20px" width="100%" />
          </Loader>
        ) : (
          <div className="flex gap-1.5">
            {isSubscriptionActive && displayPrice !== undefined && (
              <div className="text-h6-medium">
                {activePricingDetails.currency}
                {displayPrice}
              </div>
            )}

            {pricingDescription && (
              <div
                className={cn(
                  EProductSubscriptionEnum.ENTERPRISE === subscriptionType
                    ? "text-h6-medium"
                    : "pt-1 text-caption-sm-regular text-tertiary"
                )}
              >
                {pricingDescription}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subscription and trial buttons */}
      <div
        className={cn("flex flex-col gap-2 items-start", {
          "h-18": shouldShowTrialDetails && !isHorizontalView,
          "max-w-50 w-full": isHorizontalView,
        })}
      >
        <SubscriptionButton
          subscriptionType={subscriptionType}
          isProductsAPILoading={isProductsAPILoading}
          currentProduct={subscriptionProduct}
          upgradeLoader={upgradeLoader}
          handleSubscriptionUpgrade={handlePlanUpgrade}
        />
        {SUBSCRIPTION_WITH_TRIAL.includes(subscriptionType) && (
          <TrialDetails
            subscriptionType={subscriptionType}
            trialLoader={trialLoader}
            upgradeLoader={upgradeLoader}
            isProductsAPILoading={isProductsAPILoading}
            handleTrial={handleTrialStart}
          />
        )}
      </div>
    </div>
  );
});
