import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { DEFAULT_PRODUCT_BILLING_FREQUENCY, SUBSCRIPTION_WITH_BILLING_FREQUENCY } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TBillingFrequency, TProductBillingFrequency } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
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
    <section className="relative size-full overflow-y-auto scrollbar-hide">
      <div>
        <SettingsHeading
          title={t("workspace_settings.settings.billing_and_plans.heading")}
          description={t("workspace_settings.settings.billing_and_plans.description")}
        />
        <div className="mt-6">
          <SettingsBoxedControlItem
            title="Community"
            description="Unlimited projects, issues, cycles, modules, pages, and storage"
          />
        </div>
      </div>
      <div className="mt-10 flex flex-col gap-y-3">
        <h4 className="text-h6-semibold">All plans</h4>
        <PlansComparison
          isCompareAllFeaturesSectionOpen={isCompareAllFeaturesSectionOpen}
          getBillingFrequency={getBillingFrequency}
          setBillingFrequency={setBillingFrequency}
          setIsCompareAllFeaturesSectionOpen={setIsCompareAllFeaturesSectionOpen}
        />
      </div>
    </section>
  );
});
