import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import {
  SUBSCRIPTION_REDIRECTION_URLS,
  SUBSCRIPTION_WITH_BILLING_FREQUENCY,
  TALK_TO_SALES_URL,
  WORKSPACE_SETTINGS_TRACKER_ELEMENTS,
  WORKSPACE_SETTINGS_TRACKER_EVENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EProductSubscriptionEnum, TBillingFrequency } from "@plane/types";
import { getButtonStyling, getUpgradeButtonStyle } from "@plane/ui";
import { cn, getSubscriptionName } from "@plane/utils";
// components
import { DiscountInfo } from "@/components/license/modal/card/discount-info";
import { TPlanDetail } from "@/constants/plans";
// local imports
import { captureSuccess } from "@/helpers/event-tracker.helper";
import { PlanFrequencyToggle } from "./frequency-toggle";

type TPlanDetailProps = {
  subscriptionType: EProductSubscriptionEnum;
  planDetail: TPlanDetail;
  billingFrequency: TBillingFrequency | undefined;
  setBillingFrequency: (frequency: TBillingFrequency) => void;
};

const COMMON_BUTTON_STYLE =
  "relative inline-flex items-center justify-center w-full px-4 py-1.5 text-xs font-medium rounded-lg focus:outline-none transition-all duration-300 animate-slide-up";

export const PlanDetail: FC<TPlanDetailProps> = observer((props) => {
  const { subscriptionType, planDetail, billingFrequency, setBillingFrequency } = props;
  // plane hooks
  const { t } = useTranslation();
  // subscription details
  const subscriptionName = getSubscriptionName(subscriptionType);
  const isSubscriptionActive = planDetail.isActive;
  // pricing details
  const displayPrice = billingFrequency === "month" ? planDetail.monthlyPrice : planDetail.yearlyPrice;
  const pricingDescription = isSubscriptionActive ? "a user per month" : "Quote on request";
  const pricingSecondaryDescription =
    billingFrequency === "month"
      ? planDetail.monthlyPriceSecondaryDescription
      : planDetail.yearlyPriceSecondaryDescription;
  // helper styles
  const upgradeButtonStyle = getUpgradeButtonStyle(subscriptionType, false) ?? getButtonStyling("primary", "lg");

  const handleRedirection = () => {
    const frequency = billingFrequency ?? "year";
    // Get the redirection URL based on the subscription type and billing frequency
    const redirectUrl = SUBSCRIPTION_REDIRECTION_URLS[subscriptionType][frequency] ?? TALK_TO_SALES_URL;
    captureSuccess({
      eventName: WORKSPACE_SETTINGS_TRACKER_EVENTS.upgrade_plan_redirected,
      payload: {
        subscriptionType,
      },
    });
    // Open the URL in a new tab
    window.open(redirectUrl, "_blank");
  };

  return (
    <div className="flex flex-col justify-between col-span-1 p-3 space-y-0.5">
      {/* Plan name and pricing section */}
      <div className="flex flex-col items-start">
        <div className="flex w-full gap-2 items-center text-xl font-medium">
          <span className="transition-all duration-300">{subscriptionName}</span>
          {subscriptionType === EProductSubscriptionEnum.PRO && (
            <span className="px-2 rounded text-custom-primary-200 bg-custom-primary-100/20 text-xs">Popular</span>
          )}
        </div>
        <div className="flex gap-x-2 items-start text-custom-text-300 pb-1 transition-all duration-300 animate-slide-up">
          {isSubscriptionActive && displayPrice !== undefined && (
            <div className="flex items-center gap-1 text-2xl text-custom-text-100 font-semibold transition-all duration-300">
              <DiscountInfo
                currency="$"
                frequency={billingFrequency ?? "month"}
                price={displayPrice}
                subscriptionType={subscriptionType}
                className="mr-1.5"
              />
            </div>
          )}
          <div className="pt-1">
            {pricingDescription && <div className="transition-all duration-300">{pricingDescription}</div>}
            {pricingSecondaryDescription && (
              <div className="text-xs text-custom-text-400 transition-all duration-300">
                {pricingSecondaryDescription}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Billing frequency toggle */}
      {SUBSCRIPTION_WITH_BILLING_FREQUENCY.includes(subscriptionType) && billingFrequency && (
        <div className="h-8 py-0.5">
          <PlanFrequencyToggle
            subscriptionType={subscriptionType}
            monthlyPrice={planDetail.monthlyPrice || 0}
            yearlyPrice={planDetail.yearlyPrice || 0}
            selectedFrequency={billingFrequency}
            setSelectedFrequency={setBillingFrequency}
          />
        </div>
      )}

      {/* Subscription button */}
      <div className={cn("flex flex-col gap-1 py-3 items-start transition-all duration-300")}>
        <button
          onClick={handleRedirection}
          className={cn(upgradeButtonStyle, COMMON_BUTTON_STYLE)}
          data-ph-element={
            isSubscriptionActive
              ? WORKSPACE_SETTINGS_TRACKER_ELEMENTS.BILLING_UPGRADE_BUTTON(subscriptionType)
              : WORKSPACE_SETTINGS_TRACKER_ELEMENTS.BILLING_TALK_TO_SALES_BUTTON
          }
        >
          {isSubscriptionActive ? `Upgrade to ${subscriptionName}` : t("common.upgrade_cta.talk_to_sales")}
        </button>
      </div>
    </div>
  );
});
