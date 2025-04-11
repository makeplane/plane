"use client";

import { observer } from "mobx-react";
import { CircleX } from "lucide-react";
// plane constants
import { FREE_PLAN_UPGRADE_FEATURES } from "@plane/constants";
// helpers
import { cn } from "@/helpers/common.helper";

type FreePlanCardProps = {
  isOnFreePlan: boolean;
};

export const FreePlanCard = observer((props: FreePlanCardProps) => {
  const { isOnFreePlan } = props;
  return (
    <div className="py-4 px-2 border border-custom-border-200 rounded-xl">
      {isOnFreePlan && (
        <div className="py-2 px-3">
          <span className="px-2 py-1 bg-custom-background-90 text-sm text-custom-text-300 font-medium rounded">
            Your plan
          </span>
        </div>
      )}
      <div className="px-4 py-2 font-semibold">
        <div className="text-2xl">Free</div>
        <div className="text-sm text-custom-text-300">$0 per user per month</div>
      </div>
      <div className="px-2 pt-2 pb-3">
        <ul className="w-full grid grid-cols-12 gap-x-4">
          {FREE_PLAN_UPGRADE_FEATURES.map((feature) => (
            <li key={feature} className={cn("col-span-12 relative rounded-md p-2 flex")}>
              <p className="w-full text-sm font-medium leading-5 flex items-center">
                <CircleX className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                <span className="text-custom-text-200 truncate">{feature}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
