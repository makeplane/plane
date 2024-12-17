"use client";

import { FC } from "react";
import { CheckCircle } from "lucide-react";
// types
import { TProductSubscriptionType } from "@plane/types";
// ui
import { getButtonStyling, Loader } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web services
import { getBasePlanName } from "@/plane-web/components/license/modal";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export type TalkToSalesCardProps = {
  planVariant: TProductSubscriptionType;
  href: string;
  isLoading?: boolean;
  features: string[];
  upgradeLoaderType: Omit<TProductSubscriptionType, "FREE"> | undefined;
  verticalFeatureList?: boolean;
  extraFeatures?: string | React.ReactNode;
};

export const TalkToSalesCard: FC<TalkToSalesCardProps> = (props) => {
  const {
    planVariant,
    href,
    features,
    isLoading,
    verticalFeatureList = false,
    extraFeatures,
    upgradeLoaderType,
  } = props;
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const isSelfHosted = !!subscriptionDetail?.is_self_managed;
  const basePlan = getBasePlanName(planVariant, isSelfHosted);
  // Plane details
  const planeName = planVariant.charAt(0).toUpperCase() + planVariant.slice(1).toLowerCase();

  return (
    <div className="flex flex-col py-4 px-2 border border-custom-primary-200/30 rounded-xl bg-custom-primary-200/5">
      <div className="flex w-full justify-center h-10" />
      <div className="pt-6 pb-4 text-center font-semibold">
        <div className="text-2xl">Plane {planeName}</div>
        <div className="text-2xl font-bold h-11 flex justify-center items-end">
          {isLoading ? (
            <Loader className="flex flex-col items-center justify-center">
              <Loader.Item height="36px" width="4rem" />z
            </Loader>
          ) : (
            <>Quote on request</>
          )}
        </div>
        <div className="text-sm text-custom-text-300">a user per month</div>
      </div>
      {isLoading ? (
        <Loader className="flex flex-col items-center justify-center">
          <Loader.Item height="40px" width="14rem" />
        </Loader>
      ) : (
        <div className="flex flex-col items-center justify-center w-full">
          <a
            href={href}
            target="_blank"
            className={cn(
              getButtonStyling("primary", "lg", !!upgradeLoaderType),
              "relative inline-flex items-center justify-center w-56 px-4 py-2.5 text-sm font-medium rounded-lg focus:outline-none"
            )}
          >
            Talk to sales
          </a>
        </div>
      )}
      <div className="px-2 pt-6 pb-2">
        <div className="p-2 text-sm font-semibold">{`Everything in ${basePlan} +`}</div>
        <ul className="grid grid-cols-12 gap-x-4">
          {features.map((feature) => (
            <li
              key={feature}
              className={cn("col-span-12 relative rounded-md p-2 flex", {
                "sm:col-span-6": !verticalFeatureList,
              })}
            >
              <p className="w-full text-sm font-medium leading-5 flex items-center line-clamp-1">
                <CheckCircle className="h-4 w-4 mr-4 text-custom-text-300 flex-shrink-0" />
                <span className="text-custom-text-200 truncate">{feature}</span>
              </p>
            </li>
          ))}
        </ul>
        {extraFeatures && <div>{extraFeatures}</div>}
      </div>
    </div>
  );
};
