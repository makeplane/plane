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
import { TALK_TO_SALES_URL } from "@plane/constants";
import type { EProductSubscriptionEnum, IPaymentProduct, TSubscriptionPrice } from "@plane/types";
import { calculateYearlyDiscount, getSubscriptionName, getSubscriptionPriceDetails } from "@plane/utils";
// components
import { BasePaidPlanCard, TalkToSalesCard } from "@/components/license";
// local components
import type { TCheckoutParams } from "./checkout-button";
import { PlanCheckoutButton } from "./checkout-button";

export type PlanUpgradeCardProps = {
  planVariant: EProductSubscriptionEnum;
  isLoading?: boolean;
  product: IPaymentProduct | undefined;
  features: string[];
  upgradeCTA?: string;
  upgradeLoaderType?: Omit<EProductSubscriptionEnum, "FREE"> | undefined;
  verticalFeatureList?: boolean;
  extraFeatures?: string | React.ReactNode;
  renderTrialButton?: (props: { productId: string | undefined; priceId: string | undefined }) => React.ReactNode;
  handleCheckout: (params: TCheckoutParams) => void;
  isSelfHosted: boolean;
  isTrialAllowed: boolean;
};

export const PlanUpgradeCard = observer(function PlanUpgradeCard(props: PlanUpgradeCardProps) {
  const {
    planVariant,
    features,
    isLoading,
    product,
    upgradeCTA,
    verticalFeatureList = false,
    extraFeatures,
    upgradeLoaderType,
    renderTrialButton,
    handleCheckout,
    isSelfHosted,
    isTrialAllowed,
  } = props;
  // price details
  const planeName = getSubscriptionName(planVariant);
  const { monthlyPriceDetails, yearlyPriceDetails } = getSubscriptionPriceDetails(product);
  const yearlyDiscount = calculateYearlyDiscount(monthlyPriceDetails.price, yearlyPriceDetails.price);
  const prices = [monthlyPriceDetails, yearlyPriceDetails];

  if (!product?.is_active) {
    return (
      <TalkToSalesCard
        planVariant={planVariant}
        href={TALK_TO_SALES_URL}
        isLoading={isLoading}
        features={features}
        product={product}
        prices={prices}
        upgradeLoaderType={upgradeLoaderType}
        verticalFeatureList={verticalFeatureList}
        extraFeatures={extraFeatures}
        isSelfHosted={isSelfHosted}
        isTrialAllowed={isTrialAllowed}
        renderTrialButton={renderTrialButton}
      />
    );
  }

  const renderPriceContent = (price: TSubscriptionPrice) => (
    <>
      {price.recurring === "month" && "Monthly"}
      {price.recurring === "year" && (
        <>
          Yearly
          {yearlyDiscount > 0 && (
            <span className="rounded-full px-1.5  ml-1 text-xs h-5 leading-tight flex items-center justify-center">
              -{yearlyDiscount}%
            </span>
          )}
        </>
      )}
    </>
  );

  return (
    <BasePaidPlanCard
      planVariant={planVariant}
      features={features}
      prices={prices}
      upgradeLoaderType={upgradeLoaderType}
      verticalFeatureList={verticalFeatureList}
      extraFeatures={extraFeatures}
      renderPriceContent={renderPriceContent}
      renderActionButton={(price) => (
        <PlanCheckoutButton
          planeName={planeName}
          planVariant={planVariant}
          isLoading={isLoading}
          product={product}
          price={price}
          upgradeCTA={upgradeCTA}
          upgradeLoaderType={upgradeLoaderType}
          renderTrialButton={renderTrialButton}
          handleCheckout={handleCheckout}
          isSelfHosted={isSelfHosted}
          isTrialAllowed={isTrialAllowed}
        />
      )}
    />
  );
});
