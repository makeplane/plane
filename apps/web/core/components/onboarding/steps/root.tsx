"use client";

import type { FC } from "react";
import { useEffect, useMemo, useRef } from "react";
// plane imports
import type { IWorkspaceMemberInvitation } from "@plane/types";
import { EOnboardingSteps } from "@plane/types";
// local components
import { ProfileSetupStep } from "./profile";
import { RoleSetupStep } from "./role";
import { InviteTeamStep } from "./team";
import { UseCaseSetupStep } from "./usecase";
import { WorkspaceSetupStep } from "./workspace";

type Props = {
  currentStep: EOnboardingSteps;
  invitations: IWorkspaceMemberInvitation[];
  handleStepChange: (step: EOnboardingSteps, skipInvites?: boolean) => void;
};

export const OnboardingStepRoot: FC<Props> = (props) => {
  const { currentStep, invitations, handleStepChange } = props;
  // ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // scroll to top when step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [currentStep]);

  // memoized step component mapping
  const stepComponents = useMemo(
    () => ({
      [EOnboardingSteps.PROFILE_SETUP]: <ProfileSetupStep handleStepChange={handleStepChange} />,
      [EOnboardingSteps.ROLE_SETUP]: <RoleSetupStep handleStepChange={handleStepChange} />,
      [EOnboardingSteps.USE_CASE_SETUP]: <UseCaseSetupStep handleStepChange={handleStepChange} />,
      [EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN]: (
        <WorkspaceSetupStep invitations={invitations ?? []} handleStepChange={handleStepChange} />
      ),
      [EOnboardingSteps.INVITE_MEMBERS]: <InviteTeamStep handleStepChange={handleStepChange} />,
    }),
    [handleStepChange, invitations]
  );

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="w-full max-w-[24rem]">{stepComponents[currentStep]} </div>
      </div>
    </div>
  );
};
