"use client";

import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { EModalWidth, ModalCore, PlaneIcon, PlaneOneIcon } from "@plane/ui";
import { cn, getBaseSubscriptionName, getSubscriptionName } from "@plane/utils";
// helpers
import { getSubscriptionTextColor, getSuccessModalVariantStyle } from "@/components/workspace/billing/subscription";
// plane web constants
import {
  BUSINESS_PLAN_FEATURES_MAP,
  ENTERPRISE_PLAN_FEATURES_MAP,
  PRO_PLAN_FEATURES_MAP,
} from "@/plane-web/constants/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export type PaidPlanSuccessModalProps = {
  variant: EProductSubscriptionEnum;
  isOpen: boolean;
  handleClose: () => void;
};

const getPlaneLogo = (variant: EProductSubscriptionEnum) => {
  if (variant === EProductSubscriptionEnum.ONE) {
    return <PlaneOneIcon className={cn("h-11", getSubscriptionTextColor(EProductSubscriptionEnum.ONE))} />;
  }
  return <PlaneIcon className={cn("size-11", getSubscriptionTextColor(variant))} />;
};

const getRecapLink = (variant: EProductSubscriptionEnum) => {
  if (variant === EProductSubscriptionEnum.ENTERPRISE) {
    return "https://plane.so/business";
  }
  if (variant === EProductSubscriptionEnum.BUSINESS) {
    return "https://plane.so/business";
  }
  if (variant === EProductSubscriptionEnum.PRO) {
    return "https://plane.so/pro";
  }
  if (variant === EProductSubscriptionEnum.ONE) {
    return "https://docs.plane.so/plane-one/introduction";
  }
  return "https://plane.so/pricing";
};

export const getPlanFeatures = (variant: EProductSubscriptionEnum) => {
  if (variant === EProductSubscriptionEnum.ENTERPRISE) {
    return ENTERPRISE_PLAN_FEATURES_MAP;
  }
  if (variant === EProductSubscriptionEnum.BUSINESS) {
    return BUSINESS_PLAN_FEATURES_MAP;
  }
  if (variant === EProductSubscriptionEnum.PRO) {
    return PRO_PLAN_FEATURES_MAP;
  }
  if (variant === EProductSubscriptionEnum.ONE) {
    return PRO_PLAN_FEATURES_MAP;
  }
  return [];
};

export const PaidPlanSuccessModal: FC<PaidPlanSuccessModalProps> = observer((props) => {
  const { variant = EProductSubscriptionEnum.PRO, isOpen, handleClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, refreshWorkspaceSubscribedPlan } =
    useWorkspaceSubscription();
  // derived values
  const isSelfHosted = !!subscriptionDetail?.is_self_managed;

  useEffect(() => {
    if (isOpen && workspaceSlug) {
      refreshWorkspaceSubscribedPlan(workspaceSlug.toString());
    }
  }, [isOpen, workspaceSlug, refreshWorkspaceSubscribedPlan]);

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={handleClose}
      width={EModalWidth.XXXL}
      className={getSuccessModalVariantStyle(variant)}
    >
      <div className="py-10 px-10 ">
        <div className="flex items-center justify-center">{getPlaneLogo(variant)}</div>
        <div className="text-3xl font-bold leading-6 mt-4 flex justify-center items-center">Awesome! 🥳</div>
        <div className="mt-4 mb-6 text-center">
          <p className="text-center text-sm mb-2 px-8 text-custom-text-100">
            You have unlocked{" "}
            <span className={cn("font-semibold", getSubscriptionTextColor(variant))}>
              {getSubscriptionName(variant)}
            </span>{" "}
            on this workspace now.
          </p>
          <a
            href={getRecapLink(variant)}
            target="_blank"
            className="text-custom-primary-200 text-center text-sm font-medium underline outline-none focus:outline-none"
          >
            Recap what {getSubscriptionName(variant)} packs anytime
          </a>
        </div>
        <div className="py-4 px-4 rounded-xl bg-custom-background-90/70">
          <div className="text-sm text-custom-text-200 font-semibold pb-2.5">
            Everything in {getBaseSubscriptionName(variant, isSelfHosted)} +
          </div>
          <ul className="grid grid-cols-12 gap-x-4 md:gap-x-8">
            {getPlanFeatures(variant).map((feature) => (
              <li key={feature?.label} className={cn("col-span-12 sm:col-span-6 relative rounded-md p-2 flex")}>
                <div className="w-full text-sm font-medium leading-5 flex items-center">
                  <CheckCircle className="flex-shrink-0 h-4 w-4 mr-3 text-custom-text-300" />
                  <div className="relative overflow-hidden line-clamp-1">
                    <span className="text-custom-text-200 truncate">{feature?.label}</span>
                  </div>
                  {feature?.comingSoon && (
                    <div className="flex-shrink-0 flex justify-center items-center bg-custom-primary-100/90 text-white text-[7px] rounded-full px-1 h-[12px] -mt-4 ml-1 z-50 whitespace-nowrap">
                      COMING SOON
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ModalCore>
  );
});
