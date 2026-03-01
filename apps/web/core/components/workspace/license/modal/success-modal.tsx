/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { PlaneIcon, PlaneOneIcon } from "@plane/propel/icons";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { EModalWidth, ModalCore } from "@plane/ui";
import { cn, getBaseSubscriptionName, getSubscriptionName } from "@plane/utils";
// plane web constants
import {
  BUSINESS_PLAN_FEATURES_MAP,
  ENTERPRISE_PLAN_FEATURES_MAP,
  ONE_PLAN_FEATURES_MAP,
  PRO_PLAN_FEATURES_MAP,
} from "@/constants/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export type PaidPlanSuccessModalProps = {
  variant: EProductSubscriptionEnum;
  isOpen: boolean;
  handleClose: () => void;
};

const getPlaneLogo = (variant: EProductSubscriptionEnum) => {
  if (variant === EProductSubscriptionEnum.ONE) {
    return <PlaneOneIcon className="h-11 text-accent-primary" />;
  }
  return <PlaneIcon className="size-11 text-accent-primary" />;
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
    return ONE_PLAN_FEATURES_MAP;
  }
  return [];
};

export const PaidPlanSuccessModal = observer(function PaidPlanSuccessModal(props: PaidPlanSuccessModalProps) {
  const { variant = EProductSubscriptionEnum.PRO, isOpen, handleClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { refreshWorkspaceSubscribedPlan } = useWorkspaceSubscription();

  useEffect(() => {
    if (isOpen && workspaceSlug) {
      refreshWorkspaceSubscribedPlan(workspaceSlug.toString());
    }
  }, [isOpen, workspaceSlug, refreshWorkspaceSubscribedPlan]);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.XXXL}>
      <div className="py-10 px-10 ">
        <div className="flex items-center justify-center">{getPlaneLogo(variant)}</div>
        <div className="text-28 font-bold leading-6 mt-4 flex justify-center items-center">Awesome! 🥳</div>
        <div className="mt-4 mb-6 text-center">
          <p className="text-center text-13 mb-2 px-8 text-primary">
            You have unlocked <span className="font-semibold text-accent-primary">{getSubscriptionName(variant)}</span>{" "}
            on this workspace now.
          </p>
          <a
            href={getRecapLink(variant)}
            target="_blank"
            className="text-accent-primary text-center text-13 font-medium underline outline-none focus:outline-none"
            rel="noreferrer"
          >
            Recap what {getSubscriptionName(variant)} packs anytime
          </a>
        </div>
        <div className="py-4 px-4 rounded-xl bg-layer-1/70">
          <div className="text-13 text-secondary font-semibold pb-2.5">
            Everything in {getBaseSubscriptionName(variant)} +
          </div>
          <ul className="grid grid-cols-12 gap-x-4 md:gap-x-8">
            {getPlanFeatures(variant).map((feature) => (
              <li key={feature?.label} className={cn("col-span-12 sm:col-span-6 relative rounded-md p-2 flex")}>
                <div className="w-full text-13 font-medium leading-5 flex items-center">
                  <CheckCircle className="flex-shrink-0 h-4 w-4 mr-3 text-tertiary" />
                  <div className="relative overflow-hidden line-clamp-1">
                    <span className="text-secondary truncate">{feature?.label}</span>
                  </div>
                  {feature?.comingSoon && (
                    <div className="flex-shrink-0 flex justify-center items-center bg-accent-primary text-on-color text-[7px] rounded-full px-1 h-[12px] -mt-4 ml-1 z-50 whitespace-nowrap">
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
