import { useEffect, useRef } from "react";
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

function OnboardingStepContent({ currentStep, invitations, handleStepChange }: Props) {
  switch (currentStep) {
    case EOnboardingSteps.PROFILE_SETUP:
      return <ProfileSetupStep handleStepChange={handleStepChange} />;
    case EOnboardingSteps.ROLE_SETUP:
      return <RoleSetupStep handleStepChange={handleStepChange} />;
    case EOnboardingSteps.USE_CASE_SETUP:
      return <UseCaseSetupStep handleStepChange={handleStepChange} />;
    case EOnboardingSteps.WORKSPACE_CREATE_OR_JOIN:
      return <WorkspaceSetupStep invitations={invitations ?? []} handleStepChange={handleStepChange} />;
    case EOnboardingSteps.INVITE_MEMBERS:
      return <InviteTeamStep handleStepChange={handleStepChange} />;
    default:
      return null;
  }
}

export function OnboardingStepRoot(props: Props) {
  const { currentStep } = props;
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

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="w-full max-w-[24rem]">
          <OnboardingStepContent {...props} />
        </div>
      </div>
    </div>
  );
}
