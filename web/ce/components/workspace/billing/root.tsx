import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import {
  DEFAULT_PRODUCT_BILLING_FREQUENCY,
  EProductSubscriptionEnum,
  SUBSCRIPTION_WITH_BILLING_FREQUENCY,
} from "@plane/constants";
import { TBillingFrequency, TProductBillingFrequency } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { SettingsHeading } from "@/components/settings";
import { getSubscriptionTextColor } from "@/components/workspace/billing/subscription";
// local imports
import { PlansComparison } from "./comparison/root";

export const BillingRoot = observer(() => {
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCompareAllFeaturesSectionOpen, setIsCompareAllFeaturesSectionOpen] = useState(false);
  const [productBillingFrequency, setProductBillingFrequency] = useState<TProductBillingFrequency>(
    DEFAULT_PRODUCT_BILLING_FREQUENCY
  );

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const isScrolled = isCompareAllFeaturesSectionOpen ? scrollTop > 0 : false;
      setIsScrolled(isScrolled);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isCompareAllFeaturesSectionOpen]);

  return (
    <section className="relative size-full flex flex-col overflow-y-auto scrollbar-hide">
      <SettingsHeading
        title="Billing and plans"
        description="Choose your plan, manage subscriptions, and easily upgrade as your needs grow."
      />

      <div
        className={cn(
          "transition-all duration-500 ease-in-out will-change-[height,opacity]",
          isScrolled ? "h-0 opacity-0 pointer-events-none" : "h-[300px] opacity-100"
        )}
      >
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
        ref={containerRef}
        isScrolled={isScrolled}
        isCompareAllFeaturesSectionOpen={isCompareAllFeaturesSectionOpen}
        getBillingFrequency={getBillingFrequency}
        setBillingFrequency={setBillingFrequency}
        setIsCompareAllFeaturesSectionOpen={setIsCompareAllFeaturesSectionOpen}
        setIsScrolled={setIsScrolled}
      />
    </section>
  );
});
