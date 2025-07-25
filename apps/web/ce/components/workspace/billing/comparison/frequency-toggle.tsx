import { FC } from "react";
// plane imports
import { observer } from "mobx-react";
import { EProductSubscriptionEnum, TBillingFrequency } from "@plane/types";
import { getSubscriptionBackgroundColor, getDiscountPillStyle } from "@plane/ui";
import { calculateYearlyDiscount, cn } from "@plane/utils";

type TPlanFrequencyToggleProps = {
  subscriptionType: EProductSubscriptionEnum;
  monthlyPrice: number;
  yearlyPrice: number;
  selectedFrequency: TBillingFrequency;
  setSelectedFrequency: (frequency: TBillingFrequency) => void;
};

export const PlanFrequencyToggle: FC<TPlanFrequencyToggleProps> = observer((props) => {
  const { subscriptionType, monthlyPrice, yearlyPrice, selectedFrequency, setSelectedFrequency } = props;
  // derived values
  const yearlyDiscount = calculateYearlyDiscount(monthlyPrice, yearlyPrice);

  return (
    <div className="flex w-full items-center cursor-pointer py-1 animate-slide-up">
      <div
        className={cn(
          "flex space-x-1 rounded-md bg-custom-primary-200/10 p-0.5 w-full",
          getSubscriptionBackgroundColor(subscriptionType, "50")
        )}
      >
        <div
          key="month"
          onClick={() => setSelectedFrequency("month")}
          className={cn(
            "w-full rounded px-1 py-0.5 text-xs font-medium leading-5 text-center",
            selectedFrequency === "month"
              ? "bg-custom-background-100 text-custom-text-100 shadow"
              : "text-custom-text-300 hover:text-custom-text-200"
          )}
        >
          Monthly
        </div>
        <div
          key="year"
          onClick={() => setSelectedFrequency("year")}
          className={cn(
            "w-full rounded px-1 py-0.5 text-xs font-medium leading-5 text-center",
            selectedFrequency === "year"
              ? "bg-custom-background-100 text-custom-text-100 shadow"
              : "text-custom-text-300 hover:text-custom-text-200"
          )}
        >
          Yearly
          {yearlyDiscount > 0 && (
            <span className={cn(getDiscountPillStyle(subscriptionType), "rounded-full px-1 py-0.5 ml-1 text-[9px]")}>
              -{yearlyDiscount}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
