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
import { SUBSCRIPTION_WITH_BILLING_FREQUENCY, SUBSCRIPTION_WITH_TRIAL } from "@plane/constants";
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
import { DiscountInfo } from "@/components/license/modal/card/discount-info";
import type { TPlanDetail } from "@/constants/plans";
// plane web
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// local imports
import { PlanFrequencyToggle } from "./frequency-toggle";
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
  setBillingFrequency: (frequency: TBillingFrequency) => void;
  handleUpgrade: (upgradeParams: TUpgradeParams) => void;
  handleTrial: (trialParams: TUpgradeParams) => void;
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
    setBillingFrequency,
    handleTrial,
    handleUpgrade,
  } = props;
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, getIsInTrialPeriod } = useWorkspaceSubscription();

  // subscription details
  const subscriptionName = getSubscriptionName(subscriptionType);
  const currentPlan = subscriptionDetail?.product;
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
  const pricingSecondaryDescription =
    billingFrequency === "month"
      ? planDetail.monthlyPriceSecondaryDescription
      : planDetail.yearlyPriceSecondaryDescription;

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
    <div className="flex flex-col justify-between col-span-1 p-3 space-y-0.5">
      {/* Plan name and pricing section */}
      <div className="flex flex-col items-start">
        <div className="flex w-full gap-2 items-center text-h4-semibold">
          <span>{subscriptionName}</span>
          {currentPlan === EProductSubscriptionEnum.FREE && subscriptionType === EProductSubscriptionEnum.PRO && (
            <span className="px-2 py-0.5 rounded-sm text-on-color bg-accent-primary text-caption-sm-medium">
              Popular
            </span>
          )}
        </div>
        {isProductsAPILoading ? (
          <Loader className="w-full h-full">
            <Loader.Item height="45px" width="100%" />
          </Loader>
        ) : (
          <div className="flex gap-x-2 items-start text-tertiary pb-1">
            {isSubscriptionActive && displayPrice !== undefined && (
              <div className="flex items-center gap-1 text-h3-semibold text-primary">
                <DiscountInfo
                  currency={activePricingDetails.currency}
                  frequency={billingFrequency ?? "month"}
                  price={displayPrice}
                  subscriptionType={subscriptionType}
                  className="mr-1.5"
                />
              </div>
            )}
            <div className="pt-1">
              {pricingDescription && <div>{pricingDescription}</div>}
              {pricingSecondaryDescription && (
                <div className="text-caption-xs text-placeholder">{pricingSecondaryDescription}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Billing frequency toggle */}
      {subscriptionDetail?.show_payment_button &&
        SUBSCRIPTION_WITH_BILLING_FREQUENCY.includes(subscriptionType) &&
        billingFrequency && (
          <div className="h-8 py-0.5">
            <PlanFrequencyToggle
              subscriptionType={subscriptionType}
              isProductsAPILoading={isProductsAPILoading}
              subscriptionPriceDetails={pricingDetails}
              selectedFrequency={billingFrequency}
              setSelectedFrequency={setBillingFrequency}
            />
          </div>
        )}

      {/* Subscription and trial buttons */}
      <div
        className={cn("flex flex-col gap-1 py-3 items-start", {
          "h-[80px]": shouldShowTrialDetails,
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
