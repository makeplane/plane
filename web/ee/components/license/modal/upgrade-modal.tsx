"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// types
import { BUSINESS_PLAN_FEATURES, PRO_PLAN_FEATURES } from "@plane/constants";
import { IPaymentProduct, TProductSubscriptionType } from "@plane/types";
// ui
import { EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// plane web components
import { cn } from "@/helpers/common.helper";
import { ProTrialButton } from "@/plane-web/components/license/modal/trial-button";
// plane web hooks
import { useSelfHostedSubscription, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web services
import { PaymentService } from "@/plane-web/services/payment.service";
// local components
import { FreePlanCard, PlanUpgradeCard, TalkToSalesCard } from "./card";

const paymentService = new PaymentService();

export type TTrialButtonProps = {
  productId: string | undefined;
  priceId: string | undefined;
  handleClose: () => void;
};

export type TPriceFrequency = "month" | "year";

export type PaidPlanUpgradeModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export type TStripeCheckoutParams = {
  planVariant: TProductSubscriptionType;
  productId: string;
  priceId: string;
};

export const PaidPlanUpgradeModal: FC<PaidPlanUpgradeModalProps> = observer((props) => {
  const { isOpen, handleClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  const { toggleLicenseActivationModal } = useSelfHostedSubscription();
  // states
  const [selectedPlan, setSelectedPlan] = useState<TPriceFrequency>("month");
  const [upgradeLoaderType, setUpgradeLoaderType] = useState<TProductSubscriptionType | undefined>(undefined);
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
  const isOnTrial = subscriptionDetail?.is_on_trial;
  const isTrialEnded = subscriptionDetail?.is_trial_ended;
  const currentPlan = subscriptionDetail?.product;
  const planeName =
    currentPlan && ["PRO", "BUSINESS", "ENTERPRISE"].includes(currentPlan)
      ? currentPlan?.charAt(0).toUpperCase() + currentPlan?.slice(1).toLowerCase()
      : "";
  // product details
  const proProduct = (data || [])?.find((product: IPaymentProduct) => product?.type === "PRO");
  const businessProduct = (data || [])?.find((product: IPaymentProduct) => product?.type === "BUSINESS");
  // common card classname
  const COMMON_CARD_CLASSNAME = cn("flex flex-col w-full h-full justify-end col-span-12 sm:col-span-6 lg:col-span-4");
  const COMMON_EXTRA_FEATURES_CLASSNAME = cn(
    "pt-1.5 text-center text-xs text-custom-primary-200 font-semibold underline"
  );

  const handleStripeCheckout = ({ planVariant, productId, priceId }: TStripeCheckoutParams) => {
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
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.VIXL} className="rounded-2xl">
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
                Active Cycles, time tracking, bulk ops, and other features are waiting for you on one of our paid plans.
                Upgrade today to unlock features your teams need yesterday.
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
            <FreePlanCard />
          </div>
          <div className={cn(COMMON_CARD_CLASSNAME)}>
            <PlanUpgradeCard
              planVariant="PRO"
              isLoading={isProductsAPILoading}
              product={proProduct}
              features={PRO_PLAN_FEATURES}
              upgradeLoaderType={upgradeLoaderType}
              verticalFeatureList
              extraFeatures={
                <p className={COMMON_EXTRA_FEATURES_CLASSNAME}>
                  <a href="https://plane.so/pro" target="_blank">
                    See full features list
                  </a>
                </p>
              }
              renderTrialButton={({ productId, priceId }) => (
                <ProTrialButton productId={productId} priceId={priceId} handleClose={handleClose} />
              )}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              handleCheckout={handleStripeCheckout}
            />
          </div>
          <div className={cn(COMMON_CARD_CLASSNAME)}>
            {businessProduct?.is_active ? (
              <PlanUpgradeCard
                planVariant="BUSINESS"
                isLoading={isProductsAPILoading}
                product={businessProduct}
                features={BUSINESS_PLAN_FEATURES}
                upgradeLoaderType={upgradeLoaderType}
                verticalFeatureList
                extraFeatures={
                  <p className={COMMON_EXTRA_FEATURES_CLASSNAME}>
                    <a href="https://plane.so/business" target="_blank">
                      See full features list
                    </a>
                  </p>
                }
                selectedPlan={selectedPlan}
                setSelectedPlan={setSelectedPlan}
                handleCheckout={handleStripeCheckout}
              />
            ) : (
              <TalkToSalesCard
                planVariant="BUSINESS"
                href="https://plane.so/talk-to-sales"
                isLoading={isProductsAPILoading}
                features={BUSINESS_PLAN_FEATURES}
                upgradeLoaderType={upgradeLoaderType}
                verticalFeatureList
                extraFeatures={
                  <p className={COMMON_EXTRA_FEATURES_CLASSNAME}>
                    <a href="https://plane.so/business" target="_blank">
                      See full features list
                    </a>
                  </p>
                }
              />
            )}
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
