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
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { IPaymentProduct, IPaymentProductPrice, TBillingFrequency, TUpgradeParams } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";
import { Loader } from "@plane/ui";
import { getErrorMessage, getSubscriptionProduct, getSubscriptionProductPrice } from "@plane/utils";
// components
import { SettingsHeading } from "@/components/settings/heading";
import {
  CloudFreePlanCard,
  OnePlanCard,
  ProPlanCard,
  BusinessPlanCard,
  SelfHostedFreePlanCard,
  EnterprisePlanCard,
} from "@/components/workspace/license";
import { BusinessTrialBanner } from "@/components/get-started/widgets";
import { PlanUpgrade } from "@/components/workspace/settings/billing/comparison/plan-upgrade";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// services
import { PaymentService } from "@/services/payment.service";

const paymentService = new PaymentService();

type BillingRootProps = { workspaceSlug: string };

export const BillingRoot = observer(function BillingRoot(props: BillingRootProps) {
  const { workspaceSlug } = props;

  // states
  const [selectedFrequency, setSelectedFrequency] = useState<TBillingFrequency>("month");
  const [upgradeLoader, setUpgradeLoader] = useState<EProductSubscriptionEnum | null>(null);

  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  const { t } = useTranslation();
  // fetch products
  const { data } = useSWR(
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

  /**
   * Retrieves the selected product and price details for a subscription type
   * @param {EProductSubscriptionEnum} selectedSubscriptionType - Type of subscription to get details for
   * @returns {Object} Object containing selected product and price information
   * @returns {IPaymentProduct | undefined} selectedProduct - Selected product details
   * @returns {IPaymentPrice | undefined} selectedPrice - Selected price details
   */
  const getSelectedProductAndPrice = (
    selectedSubscriptionType: EProductSubscriptionEnum
  ): {
    selectedProduct: IPaymentProduct | undefined;
    selectedPrice: IPaymentProductPrice | null;
  } => {
    const selectedProduct = getSubscriptionProduct(data, selectedSubscriptionType);
    const selectedPrice = getSubscriptionProductPrice(selectedProduct, selectedFrequency);
    return { selectedProduct, selectedPrice };
  };

  /**
   * Handles the upgrade process for a selected plan
   * @param {EProductSubscriptionEnum} selectedSubscriptionType - Type of subscription to upgrade to
   * @returns {void}
   */
  const handleSelectedPlanUpgrade = (selectedSubscriptionType: EProductSubscriptionEnum): Promise<void> => {
    const { selectedProduct, selectedPrice } = getSelectedProductAndPrice(selectedSubscriptionType);
    return handleUpgradeSubscription({
      selectedSubscriptionType,
      selectedProductId: selectedProduct?.id,
      selectedPriceId: selectedPrice?.id,
      isActive: !!selectedProduct?.is_active,
    });
  };

  return (
    <section className="relative size-full overflow-y-auto scrollbar-hide">
      <div>
        <SettingsHeading
          title={t("workspace_settings.settings.billing_and_plans.heading")}
          description={t("workspace_settings.settings.billing_and_plans.description")}
        />
        <div className="mt-6 flex flex-col gap-3">
          <BusinessTrialBanner variant="compact" />
          {subscriptionDetail ? (
            <>
              {subscriptionDetail.product === EProductSubscriptionEnum.FREE &&
                (subscriptionDetail.is_self_managed ? <SelfHostedFreePlanCard /> : <CloudFreePlanCard />)}
              {subscriptionDetail.product === EProductSubscriptionEnum.ONE && (
                <OnePlanCard workspaceSlug={workspaceSlug} />
              )}
              {subscriptionDetail.product === EProductSubscriptionEnum.PRO && (
                <ProPlanCard
                  workspaceSlug={workspaceSlug}
                  upgradeLoader={upgradeLoader}
                  handleUpgrade={handleSelectedPlanUpgrade}
                />
              )}
              {subscriptionDetail.product === EProductSubscriptionEnum.BUSINESS && (
                <BusinessPlanCard
                  workspaceSlug={workspaceSlug}
                  upgradeLoader={upgradeLoader}
                  handleUpgrade={handleSelectedPlanUpgrade}
                />
              )}
              {subscriptionDetail.product === EProductSubscriptionEnum.ENTERPRISE && <EnterprisePlanCard />}
            </>
          ) : (
            <Loader className="flex w-full justify-between">
              <Loader.Item height="30px" width="40%" />
              <Loader.Item height="30px" width="20%" />
            </Loader>
          )}
        </div>
      </div>
      <PlanUpgrade
        workspaceSlug={workspaceSlug}
        selectedFrequency={selectedFrequency}
        setSelectedFrequency={setSelectedFrequency}
        heading={<div className="text-h6-medium self-center">Upgrade</div>}
        showHeadColumn
      />
    </section>
  );
});
