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

import type { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { PlaneLockup, ChevronLeftIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TOnboardingStep } from "@plane/types";
import { EOnboardingSteps } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useUser } from "@/hooks/store/user";
// local imports
import { SwitchAccountDropdown } from "./switch-account-dropdown";

type OnboardingHeaderProps = {
  currentStep: EOnboardingSteps;
  updateCurrentStep: (step: EOnboardingSteps) => void;
  hasInvitations: boolean;
};

export const OnboardingHeader = observer(function OnboardingHeader(props: OnboardingHeaderProps) {
  const { currentStep, updateCurrentStep, hasInvitations } = props;
  // store hooks
  const { data: user } = useUser();
  const { config: instanceConfig } = useInstance();
  const isSelfManaged = instanceConfig?.is_self_managed;

  // handle step back
  const handleStepBack = () => {
    switch (currentStep) {
      case EOnboardingSteps.ROLE_SETUP:
        updateCurrentStep(EOnboardingSteps.PROFILE_SETUP);
        break;
      case EOnboardingSteps.USE_CASE_SETUP:
        updateCurrentStep(EOnboardingSteps.ROLE_SETUP);
        break;
      case EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN:
        updateCurrentStep(isSelfManaged ? EOnboardingSteps.PROFILE_SETUP : EOnboardingSteps.USE_CASE_SETUP);
        break;
    }
  };

  // can go back
  const canGoBack = ![EOnboardingSteps.PROFILE_SETUP, EOnboardingSteps.INVITE_MEMBERS].includes(currentStep);

  // step order for progress tracking — include INVITE_MEMBERS if user is currently on it
  const showInviteStep = !hasInvitations || currentStep === EOnboardingSteps.INVITE_MEMBERS;
  const stepOrder: TOnboardingStep[] = [
    EOnboardingSteps.PROFILE_SETUP,
    ...(isSelfManaged ? [] : [EOnboardingSteps.ROLE_SETUP, EOnboardingSteps.USE_CASE_SETUP]),
    EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN,
    ...(showInviteStep ? [EOnboardingSteps.INVITE_MEMBERS] : []),
  ];

  // derived values
  const currentStepNumber = stepOrder.indexOf(currentStep) + 1;
  const totalSteps = stepOrder.length;
  const userName = user?.display_name
    ? user?.display_name
    : user?.first_name
      ? `${user?.first_name} ${user?.last_name ?? ""}`
      : user?.email;

  return (
    <div className="flex flex-col gap-4 sticky top-0 z-10">
      <div className="h-1.5 rounded-t-lg w-full bg-surface-1 overflow-hidden cursor-pointer">
        <Tooltip tooltipContent={`${currentStepNumber}/${totalSteps}`} position="bottom-end">
          <div
            className="h-full bg-accent-primary transition-all duration-700 ease-out"
            style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
          />
        </Tooltip>
      </div>
      <div className={cn("flex items-center justify-between gap-6 w-full px-6", canGoBack && "pl-4 pr-6")}>
        <div className="flex items-center gap-2.5">
          {canGoBack && (
            <button onClick={handleStepBack} className="cursor-pointer" type="button" disabled={!canGoBack}>
              <ChevronLeftIcon className="size-6 text-placeholder" />
            </button>
          )}
          <PlaneLockup height={20} width={95} className="text-primary" />
        </div>
        <SwitchAccountDropdown fullName={userName} />
      </div>
    </div>
  );
});
