import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { DEFAULT_PRODUCT_BILLING_FREQUENCY, SUBSCRIPTION_WITH_BILLING_FREQUENCY } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EProductSubscriptionEnum, TBillingFrequency, TProductBillingFrequency } from "@plane/types";
import { getSubscriptionTextColor } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { SettingsHeading } from "@/components/settings";
// local imports
import { PlansComparison } from "./comparison/root";

export const BillingRoot = observer(() => {
  const [isCompareAllFeaturesSectionOpen, setIsCompareAllFeaturesSectionOpen] = useState(false);
  const [productBillingFrequency, setProductBillingFrequency] = useState<TProductBillingFrequency>(
    DEFAULT_PRODUCT_BILLING_FREQUENCY
  );
  const { t } = useTranslation();

  /**
   * Retrieves the billing frequency for a given subscription type
   * @param {EProductSubscriptionEnum} subscriptionType - Type of subscription to get frequency for
   * @returns {TBillingFrequency | undefined} - Billing frequency if subscription supports it, undefined otherwise
   */
  const getBillingFrequency = (subscriptionType: EProductSubscriptionEnum): TBillingFrequency | undefined =>
    SUBSCRIPTION_WITH_BILLING_FREQUENCY.includes(subscriptionType)
      ? productBillingFrequency[subscriptionType]
      : undefined;

  /**
   * Updates the billing frequency for a specific subscription type
   * @param {EProductSubscriptionEnum} subscriptionType - Type of subscription to update
   * @param {TBillingFrequency} frequency - New billing frequency to set
   * @returns {void}
   */
  const setBillingFrequency = (subscriptionType: EProductSubscriptionEnum, frequency: TBillingFrequency): void =>
    setProductBillingFrequency({ ...productBillingFrequency, [subscriptionType]: frequency });

  return (
    <section className="relative size-full flex flex-col overflow-y-auto scrollbar-hide">
      <SettingsHeading
        title={t("workspace_settings.settings.billing_and_plans.heading")}
        description={t("workspace_settings.settings.billing_and_plans.description")}
      />
      <div className={cn("transition-all duration-500 ease-in-out will-change-[height,opacity]")}>
        <div className="py-6">
          <div className={cn("px-6 py-4 border border-custom-border-200 rounded-lg")}>
            <div className="flex gap-2 font-medium items-center justify-between">
              <div className="flex flex-col gap-1">
                <h4
                  className={cn("text-xl leading-6 font-bold", getSubscriptionTextColor(EProductSubscriptionEnum.FREE))}
                >
                  Community
                </h4>
                <div className="text-sm text-custom-text-200 font-medium">
                  Unlimited projects, issues, cycles, modules, pages, and storage
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-xl font-semibold mt-3">All plans</div>
      </div>
      <PlansComparison
        isCompareAllFeaturesSectionOpen={isCompareAllFeaturesSectionOpen}
        getBillingFrequency={getBillingFrequency}
        setBillingFrequency={setBillingFrequency}
        setIsCompareAllFeaturesSectionOpen={setIsCompareAllFeaturesSectionOpen}
      />
    </section>
  );
});
