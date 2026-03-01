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
import useSWR from "swr";
import { Check } from "lucide-react";
// plane imports
import type { EExternalUpgradePlanType } from "@plane/constants";
import { EExternalUpgradeEditionType } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
import type { IPaymentProduct } from "@plane/types";
import { Loader } from "@plane/ui";
import type { TExternalUpgradeProductPrice } from "@plane/utils";
import {
  calculateYearlyDiscount,
  cn,
  getSelfHostedProductsForExternalUpgrade,
  getSubscriptionTypeFromExternalUpgradePlanTypeEnum,
} from "@plane/utils";
// services
import { PaymentService } from "@/services/payment.service";

const paymentService = new PaymentService();

/**
 * Formats the plan price for display based on recurring interval and member count
 */
const renderPlanPricing = (price: number, members: number = 1, recurring: string) => {
  if (recurring === "month") return ((price / 100) * members).toFixed(0);
  if (recurring === "year") return ((price / 100) * members).toFixed(0);
};

type PlanPricingSelectorProps = {
  planType: EExternalUpgradePlanType;
  editionType: EExternalUpgradeEditionType;
  selectedWorkspace?: string;
};

export const PlanPricingSelector = observer((props: PlanPricingSelectorProps) => {
  const { planType, editionType, selectedWorkspace } = props;
  // states
  const [selectedPlan, setSelectedPlan] = useState<TExternalUpgradeProductPrice | null>(null);
  const [isLoading, setLoading] = useState(false);
  // derived values
  const subscriptionType = getSubscriptionTypeFromExternalUpgradePlanTypeEnum(planType);
  const isButtonDisabled = isLoading || !selectedPlan;
  const isCloudEdition = editionType === EExternalUpgradeEditionType.CLOUD;
  // For self-hosted, use environment variables to determine pricing
  const selfHostedProducts = getSelfHostedProductsForExternalUpgrade(planType);

  // fetch products if in cloud mode
  const { data: products, isLoading: isLoadingProduct } = useSWR(
    isCloudEdition && selectedWorkspace ? `CLOUD_PRODUCTS_${selectedWorkspace}` : null,
    isCloudEdition && selectedWorkspace ? () => paymentService.listProducts(selectedWorkspace) : null,
    {
      errorRetryCount: 2,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // Get pricing details based on deployment type
  const getProductPricing = () => {
    if (isCloudEdition) {
      const targetProduct = (products || [])?.find((product: IPaymentProduct) => product?.type === subscriptionType);
      const monthlyPlan = targetProduct?.prices?.find((price) => price.recurring === "month");
      const yearlyPlan = targetProduct?.prices?.find((price) => price.recurring === "year");
      const totalPaidMembers = targetProduct?.payment_quantity ?? 1;
      return {
        plans: targetProduct?.prices || [],
        totalPaidMembers,
        productId: targetProduct?.id,
        monthlyPlan,
        yearlyPlan,
      };
    } else {
      return {
        plans: selfHostedProducts,
        totalPaidMembers: 1,
        productId: undefined,
        monthlyPlan: selfHostedProducts.find((p) => p.recurring === "month"),
        yearlyPlan: selfHostedProducts.find((p) => p.recurring === "year"),
      };
    }
  };

  // Get pricing details based on deployment type
  const { plans, totalPaidMembers, productId, monthlyPlan, yearlyPlan } = getProductPricing();
  const monthlyPlanUnitPrice = monthlyPlan ? (monthlyPlan.unit_amount || 0) / 100 : 0;
  const yearlyPlanUnitPrice = yearlyPlan ? (yearlyPlan.unit_amount || 0) / 1200 : 0;
  const yearlyDiscountedPrice = calculateYearlyDiscount(monthlyPlanUnitPrice, yearlyPlanUnitPrice);

  // Handle payment action based on edition type
  const handlePaymentAction = (priceId: string | undefined) => {
    if (!priceId) {
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Please select a plan to continue",
      });
      return;
    }

    if (editionType === EExternalUpgradeEditionType.CLOUD) {
      handleStripeCheckout(priceId);
    } else {
      handleSelfHostedRedirection(priceId);
    }
  };

  // Handle Stripe checkout for cloud upgrades
  const handleStripeCheckout = (priceId: string) => {
    if (!selectedWorkspace) {
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Please select a workspace to continue",
      });
      return;
    }
    setLoading(true);
    paymentService
      .getCurrentWorkspacePaymentLink(selectedWorkspace, {
        price_id: priceId,
        product_id: productId,
      })
      .then((response) => {
        if (response.url) {
          window.open(response.url, "_blank");
        }
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? "Failed to generate payment link. Please try again.",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Handle self-hosted redirection
  const handleSelfHostedRedirection = (priceId: string) => {
    const plan = selfHostedProducts.find((p) => p.id === priceId);
    if (plan?.redirection_link) {
      window.open(plan.redirection_link, "_blank");
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to generate payment link.",
      });
    }
  };

  const getPaymentButtonText = () => {
    if (isLoading) return "Redirecting to payment";
    if (!selectedPlan) return "Select a plan to continue";
    return `Pay $${renderPlanPricing(selectedPlan.unit_amount, totalPaidMembers, selectedPlan.recurring)} every ${selectedPlan?.recurring}`;
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      <div className="flex flex-col items-center gap-2 pb-4">
        <div className="text-h3-semibold">Choose your billing frequency</div>
        {!!yearlyDiscountedPrice && (
          <div className="text-center text-body-sm-regular text-tertiary">
            Upgrade to our yearly plan and get ${Math.round(yearlyDiscountedPrice)}% off.
          </div>
        )}
      </div>
      {isLoadingProduct ? (
        <div className="flex flex-col rounded gap-1 w-full">
          <Loader.Item height="90px" />
          <Loader.Item height="90px" />
        </div>
      ) : (
        <div className="flex flex-col rounded w-full">
          {plans &&
            plans.length > 0 &&
            plans.map((plan) => (
              <div
                key={plan.id || plan.unit_amount}
                className={cn(
                  "flex items-center justify-between gap-6 border border-strong shadow-raised-100 cursor-pointer rounded py-6 px-4 first:rounded-b-none last:rounded-t-none bg-layer-2",
                  {
                    "border-accent-strong": plan.recurring === selectedPlan?.recurring,
                  }
                )}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={cn("flex items-center justify-center size-6 rounded-full", {
                      "bg-accent-primary text-on-color": plan.recurring === selectedPlan?.recurring,
                      "border border-subtle-1": plan.recurring !== selectedPlan?.recurring,
                    })}
                  >
                    {plan.recurring === selectedPlan?.recurring && <Check className="size-4 stroke-2" />}
                  </span>
                  <div className="flex flex-col">
                    {totalPaidMembers && (
                      <div className="flex items-center gap-2">
                        <span className="text-h4-semibold">
                          ${renderPlanPricing(plan.unit_amount, 1, plan.recurring)}
                        </span>
                        <span className="text-body-xs-regular text-tertiary">
                          {` per user per ${plan.recurring} x ${totalPaidMembers}`}
                        </span>
                      </div>
                    )}
                    <span className="text-body-xs-regular text-tertiary">
                      {`Billed ${plan.recurring === "month" ? "monthly" : "yearly"}`}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col text-right">
                  {totalPaidMembers && (
                    <span className="text-h4-semibold">
                      ${renderPlanPricing(plan.unit_amount, totalPaidMembers, plan.recurring)}
                    </span>
                  )}
                  <span className="text-body-xs-regular text-tertiary">
                    {plan.recurring === "month" ? "per month" : "per year"}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
      <Button
        className="mt-6 w-full"
        size="xl"
        onClick={() => handlePaymentAction(selectedPlan?.id)}
        loading={isLoading}
        disabled={isButtonDisabled}
      >
        {getPaymentButtonText()}
      </Button>
    </div>
  );
});
