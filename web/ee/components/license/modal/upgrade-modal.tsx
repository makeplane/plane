"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import {
  BUSINESS_PLAN_FEATURES,
  ENTERPRISE_PLAN_FEATURES,
  EProductSubscriptionEnum,
  PRO_PLAN_FEATURES,
  SUBSCRIPTION_WEBPAGE_URLS,
} from "@plane/constants";
import { IPaymentProduct } from "@plane/types";
import { EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
import { cn } from "@plane/utils";
import { FreePlanCard, PlanUpgradeCard } from "@/components/license";
import { TCheckoutParams } from "@/components/license/modal/card/checkout-button";
// plane web imports
import { ProTrialButton } from "@/plane-web/components/license/modal/trial-button";
import { useSelfHostedSubscription, useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { PaymentService } from "@/plane-web/services/payment.service";

const paymentService = new PaymentService();

export type TTrialButtonProps = {
  productId: string | undefined;
  priceId: string | undefined;
  handleClose: () => void;
};

export type PaidPlanUpgradeModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const PaidPlanUpgradeModal: FC<PaidPlanUpgradeModalProps> = observer((props) => {
  const { isOpen, handleClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  const { toggleLicenseActivationModal } = useSelfHostedSubscription();
  // states
  const [upgradeLoaderType, setUpgradeLoaderType] = useState<EProductSubscriptionEnum | undefined>(undefined);
  // fetch products
  const { isLoading: isProductsAPILoading, data } = useSWR(
    workspaceSlug ? `PAYMENT_PRODUCTS_${workspaceSlug?.toString()}` : null,
    workspaceSlug ? () => paymentService.listProducts(workspaceSlug.toString()) : null,
    {
      errorRetryCount: 2,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );
  // derived values
  const isSelfHosted = subscriptionDetail?.is_self_managed;
  const isTrialAllowed = subscriptionDetail?.is_trial_allowed;
  const isOnTrial = subscriptionDetail?.is_on_trial;
  const isTrialEnded = subscriptionDetail?.is_trial_ended;
  const currentPlan = subscriptionDetail?.product;
  const planeName =
    currentPlan && ["PRO", "BUSINESS", "ENTERPRISE"].includes(currentPlan)
      ? currentPlan?.charAt(0).toUpperCase() + currentPlan?.slice(1).toLowerCase()
      : "";
  // product details
  const proProduct = (data || [])?.find((product: IPaymentProduct) => product?.type === EProductSubscriptionEnum.PRO);
  const businessProduct = (data || [])?.find(
    (product: IPaymentProduct) => product?.type === EProductSubscriptionEnum.BUSINESS
  );
  const enterpriseProduct = (data || [])?.find(
    (product: IPaymentProduct) => product?.type === EProductSubscriptionEnum.ENTERPRISE
  );
  // common card classname
  const COMMON_CARD_CLASSNAME = cn("flex flex-col w-full h-full justify-end col-span-12 sm:col-span-6 xl:col-span-3");
  const COMMON_EXTRA_FEATURES_CLASSNAME = cn(
    "pt-2 text-center text-xs text-custom-primary-200 font-medium hover:underline"
  );

  const handleStripeCheckout = ({ planVariant, productId, priceId }: TCheckoutParams) => {
    if (!productId || !priceId) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Unable to get the product id or price id. Please try again.",
      });
      return;
    }
    setUpgradeLoaderType(planVariant);
    paymentService
      .getCurrentWorkspacePaymentLink(workspaceSlug.toString(), {
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
        setUpgradeLoaderType(undefined);
      });
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.VIIXL} className="rounded-2xl">
      <div className="p-10 max-h-[90vh] overflow-auto">
        <div className="grid grid-cols-12 gap-6 h-full">
          <div className={cn(COMMON_CARD_CLASSNAME)}>
            {isOnTrial && (
              <div className="relative flex justify-start items-center pb-4">
                <div className="p-1 px-2 bg-custom-primary-100/20 text-custom-primary-100 text-xs rounded-full font-medium">
                  {planeName ? `${planeName} trial in progress` : "Trial in progress"}
                </div>
              </div>
            )}
            {isTrialEnded && (
              <div className="relative flex justify-start items-center pb-4">
                <div className="p-1 px-2 bg-red-500/20 text-red-600 text-xs rounded-full font-medium">Trial ended</div>
              </div>
            )}
            <div className="text-3xl font-bold leading-8 flex">Upgrade to a paid plan and unlock missing features.</div>
            <div className="mt-4 mb-2">
              <p className="text-sm mb-4 pr-8 text-custom-text-100">
                Dashboards, Workflows, Approvals, Time Management, and other superpowers are just a click away. Upgrade
                today to unlock features your teams need yesterday.
              </p>
            </div>
            {/* Workspace activation */}
            {isSelfHosted && (
              <div className="flex gap-1 px-1 pb-3 text-sm text-custom-text-200 font-medium">
                Got a license?
                <button
                  className="text-custom-primary-200 hover:underline outline-none"
                  onClick={() => {
                    handleClose();
                    toggleLicenseActivationModal(true);
                  }}
                >
                  Activate this workspace
                </button>
              </div>
            )}
            {/* Free plan details */}
            <FreePlanCard isOnFreePlan={subscriptionDetail?.product === EProductSubscriptionEnum.FREE} />
          </div>
          <div className={cn(COMMON_CARD_CLASSNAME)}>
            <PlanUpgradeCard
              planVariant={EProductSubscriptionEnum.PRO}
              isLoading={isProductsAPILoading}
              product={proProduct}
              features={PRO_PLAN_FEATURES}
              upgradeLoaderType={upgradeLoaderType}
              verticalFeatureList
              extraFeatures={
                <p className={COMMON_EXTRA_FEATURES_CLASSNAME}>
                  <a href={SUBSCRIPTION_WEBPAGE_URLS[EProductSubscriptionEnum.PRO]} target="_blank">
                    See full features list
                  </a>
                </p>
              }
              renderTrialButton={({ productId, priceId }) => (
                <ProTrialButton productId={productId} priceId={priceId} handleClose={handleClose} />
              )}
              handleCheckout={handleStripeCheckout}
              isSelfHosted={!!isSelfHosted}
              isTrialAllowed={!!isTrialAllowed}
            />
          </div>
          <div className={cn(COMMON_CARD_CLASSNAME)}>
            <PlanUpgradeCard
              planVariant={EProductSubscriptionEnum.BUSINESS}
              isLoading={isProductsAPILoading}
              product={businessProduct}
              features={BUSINESS_PLAN_FEATURES}
              upgradeLoaderType={upgradeLoaderType}
              verticalFeatureList
              extraFeatures={
                <p className={COMMON_EXTRA_FEATURES_CLASSNAME}>
                  <a href={SUBSCRIPTION_WEBPAGE_URLS[EProductSubscriptionEnum.BUSINESS]} target="_blank">
                    See full features list
                  </a>
                </p>
              }
              handleCheckout={handleStripeCheckout}
              isSelfHosted={!!isSelfHosted}
              isTrialAllowed={!!isTrialAllowed}
            />
          </div>
          <div className={cn(COMMON_CARD_CLASSNAME)}>
            <PlanUpgradeCard
              planVariant={EProductSubscriptionEnum.ENTERPRISE}
              isLoading={isProductsAPILoading}
              product={enterpriseProduct}
              features={ENTERPRISE_PLAN_FEATURES}
              upgradeLoaderType={upgradeLoaderType}
              verticalFeatureList
              extraFeatures={
                <p className={COMMON_EXTRA_FEATURES_CLASSNAME}>
                  <a href={SUBSCRIPTION_WEBPAGE_URLS[EProductSubscriptionEnum.ENTERPRISE]} target="_blank">
                    See full features list
                  </a>
                </p>
              }
              handleCheckout={handleStripeCheckout}
              isSelfHosted={!!isSelfHosted}
              isTrialAllowed={!!isTrialAllowed}
            />
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
