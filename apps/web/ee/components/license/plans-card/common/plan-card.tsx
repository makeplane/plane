"use client";

import { observer } from "mobx-react";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { getSubscriptionTextColor } from "@plane/ui";
import { cn, getSubscriptionName } from "@plane/utils";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TPlanCard = {
  planVariant: EProductSubscriptionEnum;
  planDescription: React.ReactNode;
  button: React.ReactNode;
};

export const PlanCard = observer(({ planVariant, planDescription, button }: TPlanCard) => {
  const { getIsInTrialPeriod } = useWorkspaceSubscription();
  // derived values
  const planName = getSubscriptionName(planVariant);
  const isInTrialPeriod = getIsInTrialPeriod(false);

  return (
    <div className="flex gap-2 font-medium items-center justify-between">
      <div className="flex flex-col gap-1">
        <h4 className={cn("text-xl leading-6 font-bold", getSubscriptionTextColor(planVariant))}>
          {planName}
          {isInTrialPeriod && " trial"}
        </h4>
        <div className="text-sm text-custom-text-200 font-medium">{planDescription}</div>
      </div>
      <div className="flex flex-col gap-1 items-center justify-center">{button}</div>
    </div>
  );
});
