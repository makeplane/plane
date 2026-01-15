import { observer } from "mobx-react";
// plane imports
import {
  SUBSCRIPTION_REDIRECTION_URLS,
  SUBSCRIPTION_WITH_BILLING_FREQUENCY,
  TALK_TO_SALES_URL,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TBillingFrequency } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";
import { getSubscriptionName } from "@plane/utils";
// components
import { DiscountInfo } from "@/components/license/modal/card/discount-info";
import type { TPlanDetail } from "@/constants/plans";
// local imports
import { PlanFrequencyToggle } from "./frequency-toggle";

type TPlanDetailProps = {
  subscriptionType: EProductSubscriptionEnum;
  planDetail: TPlanDetail;
  billingFrequency: TBillingFrequency | undefined;
  setBillingFrequency: (frequency: TBillingFrequency) => void;
};

export const PlanDetail = observer(function PlanDetail(props: TPlanDetailProps) {
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

  const handleRedirection = () => {
    const frequency = billingFrequency ?? "year";
    // Get the redirection URL based on the subscription type and billing frequency
    const redirectUrl = SUBSCRIPTION_REDIRECTION_URLS[subscriptionType][frequency] ?? TALK_TO_SALES_URL;
    // Open the URL in a new tab
    window.open(redirectUrl, "_blank");
  };

  return (
    <div className="flex flex-col justify-between col-span-1 p-3 space-y-0.5">
      {/* Plan name and pricing section */}
      <div className="flex flex-col items-start">
        <div className="flex w-full gap-2 items-center text-h4-semibold">
          <span>{subscriptionName}</span>
          {subscriptionType === EProductSubscriptionEnum.PRO && (
            <span className="px-2 py-0.5 rounded-sm text-on-color bg-accent-primary text-caption-sm-medium">
              Popular
            </span>
          )}
        </div>
        <div className="flex gap-x-2 items-start text-tertiary pb-1">
          {isSubscriptionActive && displayPrice !== undefined && (
            <div className="flex items-center gap-1 text-h3-semibold text-primary">
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
            {pricingDescription && <div>{pricingDescription}</div>}
            {pricingSecondaryDescription && (
              <div className="text-caption-xs text-placeholder">{pricingSecondaryDescription}</div>
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
      <div className="flex flex-col gap-1 py-3 items-start">
        <Button variant="primary" size="lg" onClick={handleRedirection} className="w-full">
          {isSubscriptionActive ? `Upgrade to ${subscriptionName}` : t("common.upgrade_cta.talk_to_sales")}
        </Button>
      </div>
    </div>
  );
});
