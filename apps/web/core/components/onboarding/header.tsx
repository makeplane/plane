"use client";

import type { FC } from "react";
import { observer } from "mobx-react";
import { ChevronLeft } from "lucide-react";
// plane imports
import { PlaneLockup } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TOnboardingStep } from "@plane/types";
import { EOnboardingSteps } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useUser } from "@/hooks/store/user";
// local imports
import { SwitchAccountDropdown } from "./switch-account-dropdown";

type OnboardingHeaderProps = {
  currentStep: EOnboardingSteps;
  updateCurrentStep: (step: EOnboardingSteps) => void;
  hasInvitations: boolean;
};

export const OnboardingHeader: FC<OnboardingHeaderProps> = observer((props) => {
  const { currentStep, updateCurrentStep, hasInvitations } = props;
  // store hooks
  const { data: user } = useUser();

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
        updateCurrentStep(EOnboardingSteps.USE_CASE_SETUP);
        break;
    }
  };

  // can go back
  const canGoBack = ![EOnboardingSteps.PROFILE_SETUP, EOnboardingSteps.INVITE_MEMBERS].includes(currentStep);

  // Get current step number for progress tracking
  const getCurrentStepNumber = (): number => {
    const stepOrder: TOnboardingStep[] = [
      EOnboardingSteps.PROFILE_SETUP,
      EOnboardingSteps.ROLE_SETUP,
      EOnboardingSteps.USE_CASE_SETUP,
      ...(hasInvitations
        ? [EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN]
        : [EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN, EOnboardingSteps.INVITE_MEMBERS]),
    ];
    return stepOrder.indexOf(currentStep) + 1;
  };

  // derived values
  const currentStepNumber = getCurrentStepNumber();
  const totalSteps = hasInvitations ? 4 : 5; // 4 if invites available, 5 if not
  const userName = user?.display_name ?? `${user?.first_name} ${user?.last_name}` ?? user?.email;

  return (
    <div className="flex flex-col gap-4 sticky top-0 z-10">
      <div className="h-1.5 rounded-t-lg w-full bg-custom-background-100 overflow-hidden cursor-pointer">
        <Tooltip tooltipContent={`${currentStepNumber}/${totalSteps}`} position="bottom-end">
          <div
            className="h-full bg-custom-primary-100 transition-all duration-700 ease-out"
            style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
          />
        </Tooltip>
      </div>
      <div className={cn("flex items-center justify-between gap-6 w-full px-6", canGoBack && "pl-4 pr-6")}>
        <div className="flex items-center gap-2.5">
          {canGoBack && (
            <button onClick={handleStepBack} className="cursor-pointer" type="button" disabled={!canGoBack}>
              <ChevronLeft className="size-6 text-custom-text-400" />
            </button>
          )}
          <PlaneLockup height={20} width={95} className="text-custom-text-100" />
        </div>
        <SwitchAccountDropdown fullName={userName} />
      </div>
    </div>
  );
});
