"use client";

import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { EModalWidth, ModalCore, PlaneIcon } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { BUSINESS_PLAN_FEATURES_MAP } from "@/plane-web/constants/license";
import { getSubscriptionTextColor } from "@/plane-web/helpers/subscription";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export type BusinessPlanSuccessModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const BusinessPlanSuccessModal: FC<BusinessPlanSuccessModalProps> = observer((props) => {
  const { workspaceSlug } = useParams();
  const { isOpen, handleClose } = props;
  // hooks
  const { refreshWorkspaceSubscribedPlan } = useWorkspaceSubscription();

  useEffect(() => {
    if (isOpen && workspaceSlug) {
      refreshWorkspaceSubscribedPlan(workspaceSlug.toString());
    }
  }, [isOpen, workspaceSlug, refreshWorkspaceSubscribedPlan]);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.XXXL} className="rounded-xl">
      <div className="py-10 px-10 ">
        <div className="flex items-center justify-center">
          <PlaneIcon className={cn("size-11", getSubscriptionTextColor(EProductSubscriptionEnum.BUSINESS))} />
        </div>
        <div className="text-3xl font-bold leading-6 mt-4 flex justify-center items-center">Awesome! 🥳</div>
        <div className="mt-4 mb-6 text-center">
          <p className="text-center text-sm mb-2 px-8 text-custom-text-100">
            You have unlocked Business on this workspace now.
          </p>
          <a
            href={"https://plane.so/business"}
            target="_blank"
            className="text-custom-primary-200 text-center text-sm font-semibold underline outline-none focus:outline-none"
          >
            Recap what Business packs anytime
          </a>
        </div>
        <div className="py-4 px-4 border border-custom-primary-200/30 rounded-xl bg-custom-primary-200/5">
          <div className="text-sm text-custom-text-200 font-semibold pb-2.5">Everything in Pro +</div>
          <ul className="grid grid-cols-12 gap-x-4 md:gap-x-8">
            {BUSINESS_PLAN_FEATURES_MAP.map((feature) => (
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
