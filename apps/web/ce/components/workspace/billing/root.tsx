import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { DEFAULT_PRODUCT_BILLING_FREQUENCY, SUBSCRIPTION_WITH_BILLING_FREQUENCY } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TBillingFrequency, TProductBillingFrequency } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";
// components
import { SettingsHeading } from "@/components/settings/heading";
// local imports
import { PlansComparison } from "./comparison/root";

export const BillingRoot = observer(function BillingRoot() {
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
      <div>
        <div className="py-6">
          <div className="px-6 py-4 rounded-lg bg-layer-1">
            <div className="flex gap-2 items-center justify-between">
              <div className="flex flex-col gap-1">
                <h4 className="text-h4-bold text-primary">Community</h4>
                <div className="text-caption-md-medium text-secondary">
                  Unlimited projects, issues, cycles, modules, pages, and storage
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-h4-semibold mt-3">All plans</div>
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
