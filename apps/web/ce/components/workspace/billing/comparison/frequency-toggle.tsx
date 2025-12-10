import type { FC } from "react";
// plane imports
import { observer } from "mobx-react";
import type { EProductSubscriptionEnum, TBillingFrequency } from "@plane/types";
import { getSubscriptionBackgroundColor, getDiscountPillStyle } from "@plane/ui";
import { calculateYearlyDiscount, cn } from "@plane/utils";

type TPlanFrequencyToggleProps = {
  subscriptionType: EProductSubscriptionEnum;
  monthlyPrice: number;
  yearlyPrice: number;
  selectedFrequency: TBillingFrequency;
  setSelectedFrequency: (frequency: TBillingFrequency) => void;
};

export const PlanFrequencyToggle = observer(function PlanFrequencyToggle(props: TPlanFrequencyToggleProps) {
  const { subscriptionType, monthlyPrice, yearlyPrice, selectedFrequency, setSelectedFrequency } = props;
  // derived values
  const yearlyDiscount = calculateYearlyDiscount(monthlyPrice, yearlyPrice);

  return (
    <div className="flex w-full items-center cursor-pointer py-1 animate-slide-up">
      <div
        className={cn(
          "flex space-x-1 rounded-md bg-accent-primary/80/10 p-0.5 w-full",
          getSubscriptionBackgroundColor(subscriptionType, "50")
        )}
      >
        <button
          type="button"
          onClick={() => setSelectedFrequency("month")}
          className={cn(
            "w-full rounded-sm px-1 py-0.5 text-11 font-medium leading-5 text-center",
            selectedFrequency === "month"
              ? "bg-layer-transparent-selected text-primary shadow"
              : "hover:bg-layer-transparent-hover text-tertiary hover:text-secondary"
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setSelectedFrequency("year")}
          className={cn(
            "w-full rounded-sm px-1 py-0.5 text-11 font-medium leading-5 text-center",
            selectedFrequency === "year"
              ? "bg-layer-transparent-selected text-primary shadow"
              : "hover:bg-layer-transparent-hover text-tertiary hover:text-secondary"
          )}
        >
          Yearly
          {yearlyDiscount > 0 && (
            <span className={cn(getDiscountPillStyle(subscriptionType), "rounded-full px-1 py-0.5 ml-1 text-9")}>
              -{yearlyDiscount}%
            </span>
          )}
        </button>
      </div>
    </div>
  );
});
