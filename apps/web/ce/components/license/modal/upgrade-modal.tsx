import { observer } from "mobx-react";
// plane imports
import {
  BUSINESS_PLAN_FEATURES,
  ENTERPRISE_PLAN_FEATURES,
  PLANE_COMMUNITY_PRODUCTS,
  PRO_PLAN_FEATURES,
  SUBSCRIPTION_REDIRECTION_URLS,
  SUBSCRIPTION_WEBPAGE_URLS,
  TALK_TO_SALES_URL,
} from "@plane/constants";
import { EProductSubscriptionEnum } from "@plane/types";
import { EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { FreePlanCard, PlanUpgradeCard } from "@/components/license";
import type { TCheckoutParams } from "@/components/license/modal/card/checkout-button";

// Constants
const COMMON_CARD_CLASSNAME = "flex flex-col w-full h-full justify-end col-span-12 sm:col-span-6 xl:col-span-3";
const COMMON_EXTRA_FEATURES_CLASSNAME = "pt-2 text-center text-caption-md-medium text-accent-primary hover:underline";

export type PaidPlanUpgradeModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const PaidPlanUpgradeModal = observer(function PaidPlanUpgradeModal(props: PaidPlanUpgradeModalProps) {
  const { isOpen, handleClose } = props;
  // derived values
  const isSelfHosted = true;
  const isTrialAllowed = false;

  const handleRedirection = ({ planVariant, priceId }: TCheckoutParams) => {
    // Get the product and price using plane community constants
    const product = PLANE_COMMUNITY_PRODUCTS[planVariant];
    const price = product.prices.find((price) => price.id === priceId);
    const frequency = price?.recurring ?? "year";
    // Redirect to the appropriate URL
    const redirectUrl = SUBSCRIPTION_REDIRECTION_URLS[planVariant][frequency] ?? TALK_TO_SALES_URL;
    window.open(redirectUrl, "_blank");
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.VIIXL} className="rounded-2xl">
      <div className="p-10 max-h-[90vh] overflow-auto">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Free Plan Section */}
          <div className={cn(COMMON_CARD_CLASSNAME)}>
            <div className="text-24 font-bold leading-8 flex">Upgrade to a paid plan and unlock missing features.</div>
            <div className="mt-4 mb-2">
              <p className="text-13 mb-4 pr-8 text-primary">
                Dashboards, Workflows, Approvals, Time Management, and other superpowers are just a click away. Upgrade
                today to unlock features your teams need yesterday.
              </p>
            </div>

            {/* Free plan details */}
            <FreePlanCard isOnFreePlan />
          </div>

          {/* Pro plan */}
          <div className={cn(COMMON_CARD_CLASSNAME)}>
            <PlanUpgradeCard
              planVariant={EProductSubscriptionEnum.PRO}
              product={PLANE_COMMUNITY_PRODUCTS[EProductSubscriptionEnum.PRO]}
              features={PRO_PLAN_FEATURES}
              verticalFeatureList
              extraFeatures={
                <p className={COMMON_EXTRA_FEATURES_CLASSNAME}>
                  <a href={SUBSCRIPTION_WEBPAGE_URLS[EProductSubscriptionEnum.PRO]} target="_blank" rel="noreferrer">
                    See full features list
                  </a>
                </p>
              }
              handleCheckout={handleRedirection}
              isSelfHosted={!!isSelfHosted}
              isTrialAllowed={!!isTrialAllowed}
            />
          </div>
          <div className={cn(COMMON_CARD_CLASSNAME)}>
            <PlanUpgradeCard
              planVariant={EProductSubscriptionEnum.BUSINESS}
              product={PLANE_COMMUNITY_PRODUCTS[EProductSubscriptionEnum.BUSINESS]}
              features={BUSINESS_PLAN_FEATURES}
              verticalFeatureList
              extraFeatures={
                <p className={COMMON_EXTRA_FEATURES_CLASSNAME}>
                  <a
                    href={SUBSCRIPTION_WEBPAGE_URLS[EProductSubscriptionEnum.BUSINESS]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    See full features list
                  </a>
                </p>
              }
              handleCheckout={handleRedirection}
              isSelfHosted={!!isSelfHosted}
              isTrialAllowed={!!isTrialAllowed}
            />
          </div>
          <div className={cn(COMMON_CARD_CLASSNAME)}>
            <PlanUpgradeCard
              planVariant={EProductSubscriptionEnum.ENTERPRISE}
              product={PLANE_COMMUNITY_PRODUCTS[EProductSubscriptionEnum.ENTERPRISE]}
              features={ENTERPRISE_PLAN_FEATURES}
              verticalFeatureList
              extraFeatures={
                <p className={COMMON_EXTRA_FEATURES_CLASSNAME}>
                  <a
                    href={SUBSCRIPTION_WEBPAGE_URLS[EProductSubscriptionEnum.ENTERPRISE]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    See full features list
                  </a>
                </p>
              }
              handleCheckout={handleRedirection}
              isSelfHosted={!!isSelfHosted}
              isTrialAllowed={!!isTrialAllowed}
            />
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
