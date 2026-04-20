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
// plane imports
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TBillingFrequency, TUpgradeParams } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";
import { cn, getErrorMessage } from "@plane/utils";
// components
import { PlansComparison } from "@/components/workspace/settings/billing/comparison";
import { PlanFrequencyToggle } from "@/components/workspace/settings/billing/comparison/frequency-toggle";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// services
import { PaymentService } from "@/services/payment.service";

const paymentService = new PaymentService();

type PlanUpgradeProps = {
  workspaceSlug: string;
  selectedFrequency: TBillingFrequency;
  setSelectedFrequency: (frequency: TBillingFrequency) => void;
  heading: React.ReactNode;
  showHeadColumn?: boolean;
  className?: string;
};

export const PlanUpgrade = observer(function PlanUpgrade(props: PlanUpgradeProps) {
  const {
    workspaceSlug,
    selectedFrequency,
    setSelectedFrequency,
    heading,
    showHeadColumn = false,
    className = "",
  } = props;

  const [upgradeLoader, setUpgradeLoader] = useState<EProductSubscriptionEnum | null>(null);
  const [trialLoader, setTrialLoader] = useState<EProductSubscriptionEnum | null>(null);
  // store hooks
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    freeTrialSubscription,
    handleSuccessModalToggle,
  } = useWorkspaceSubscription();
  // fetch products
  const { isLoading: isProductsAPILoading, data } = useSWR(
    workspaceSlug ? ["PAYMENT_PRODUCTS", workspaceSlug.toString()] : null,
    workspaceSlug ? () => paymentService.listProducts(workspaceSlug.toString()) : null,
    {
      errorRetryCount: 2,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );
  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;
  const isOfflinePayment = !!subscriptionDetail?.is_offline_payment;

  /**
   * Initiates a free trial for a selected subscription plan
   * @param {TUpgradeParams} trialParams - Object containing trial subscription parameters
   * @param {EProductSubscriptionEnum} trialParams.selectedSubscriptionType - Type of subscription to start trial for
   * @param {string} trialParams.selectedProductId - ID of the product to start trial for
   * @param {string} trialParams.selectedPriceId - ID of the price to start trial for
   * @returns {Promise<void>} - Resolves when trial is started or rejects with error
   * @throws {Error} - If product/price IDs are missing or trial fails
   */
  const handleTrial = async (trialParams: TUpgradeParams): Promise<void> => {
    const { selectedSubscriptionType, selectedProductId, selectedPriceId } = trialParams;
    if (isSelfManaged) return; // Self-hosted workspaces can't have trials
    if (isOfflinePayment) return; // Offline payments can't have trials
    if (!selectedProductId || !selectedPriceId) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Missing product or price ID" });
      return;
    }
    try {
      setTrialLoader(selectedSubscriptionType);
      if (!workspaceSlug) return;
      await freeTrialSubscription(workspaceSlug.toString(), {
        product_id: selectedProductId,
        price_id: selectedPriceId,
      });
      handleSuccessModalToggle(true);
    } catch (error) {
      const currentError = error as { error: string; detail: string };
      console.error("Error in freeTrialSubscription", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: currentError?.detail ?? currentError?.error ?? "Something went wrong. Please try again.",
      });
    } finally {
      setTrialLoader(null);
    }
  };

  /**
   * Processes subscription upgrade by generating payment link and redirecting user
   * @param {TUpgradeParams} upgradeParams - Object containing upgrade parameters
   * @param {EProductSubscriptionEnum} upgradeParams.selectedSubscriptionType - Type of subscription to upgrade to
   * @param {string} upgradeParams.selectedProductId - ID of the product to upgrade to
   * @param {string} upgradeParams.selectedPriceId - ID of the price to upgrade to
   * @param {boolean} upgradeParams.isActive - Whether the product is currently active
   * @returns {void}
   */
  const handleUpgradeSubscription = async (upgradeParams: TUpgradeParams): Promise<void> => {
    const { selectedSubscriptionType, selectedProductId, selectedPriceId, isActive } = upgradeParams;
    if (!isActive) {
      window.open("https://plane.so/talk-to-sales", "_blank");
      return;
    }
    if (isOfflinePayment) {
      window.open("mailto:support@plane.so", "_blank");
      return;
    }
    if (!selectedProductId || !selectedPriceId) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Missing product or price ID" });
      return;
    }
    setUpgradeLoader(selectedSubscriptionType);
    try {
      const response = await paymentService.getCurrentWorkspacePaymentLink(workspaceSlug.toString(), {
        price_id: selectedPriceId,
        product_id: selectedProductId,
      });
      if (response.url) window.open(response.url, isSelfManaged ? "_blank" : "_self");
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: getErrorMessage(error, "Failed to generate payment link"),
      });
    } finally {
      setUpgradeLoader(null);
    }
  };

  if (!subscriptionDetail) return null;

  return (
    <div className={cn("mt-10 flex flex-col gap-y-3", className)}>
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        {heading}
        <PlanFrequencyToggle selectedFrequency={selectedFrequency} setSelectedFrequency={setSelectedFrequency} />
      </div>

      <PlansComparison
        products={data}
        isProductsAPILoading={isProductsAPILoading}
        trialLoader={trialLoader}
        upgradeLoader={upgradeLoader}
        handleTrial={handleTrial}
        handleUpgrade={handleUpgradeSubscription}
        selectedFrequency={selectedFrequency}
        showHeadColumn={showHeadColumn}
      />
    </div>
  );
});
