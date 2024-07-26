import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
// icons
import { useTheme } from "next-themes";
// types
import { IWorkspaceMemberInvitation, TOnboardingSteps } from "@plane/types";
// components
import { Invitations, OnboardingHeader, SwitchAccountDropdown, CreateWorkspace } from "@/components/onboarding";
// hooks
import { useUser } from "@/hooks/store";
// assets
import CreateJoinWorkspaceDark from "@/public/onboarding/create-join-workspace-dark.svg";
import CreateJoinWorkspace from "@/public/onboarding/create-join-workspace.svg";
import { LogoSpinner } from "../common";

export enum ECreateOrJoinWorkspaceViews {
  WORKSPACE_CREATE = "WORKSPACE_CREATE",
  WORKSPACE_JOIN = "WORKSPACE_JOIN",
}

type Props = {
  invitations: IWorkspaceMemberInvitation[];
  totalSteps: number;
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
  finishOnboarding: () => Promise<void>;
};

export const CreateOrJoinWorkspaces: React.FC<Props> = observer((props) => {
  const { invitations, totalSteps, stepChange, finishOnboarding } = props;
  // states
  const [currentView, setCurrentView] = useState<ECreateOrJoinWorkspaceViews | null>(null);
  // store hooks
  const { data: user } = useUser();
  // hooks
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (invitations.length > 0) {
      setCurrentView(ECreateOrJoinWorkspaceViews.WORKSPACE_JOIN);
    } else {
      setCurrentView(ECreateOrJoinWorkspaceViews.WORKSPACE_CREATE);
    }
  }, [invitations]);

  const handleNextStep = async () => {
    if (!user) return;

    await finishOnboarding();
  };

  return (
    <div className="flex h-full w-full">
      <div className="w-full h-full overflow-auto px-6 py-10 sm:px-7 sm:py-14 md:px-14 lg:px-28">
        <div className="flex items-center justify-between">
          <OnboardingHeader currentStep={totalSteps - 1} totalSteps={totalSteps} />
          <div className="shrink-0 lg:hidden">
            <SwitchAccountDropdown />
          </div>
        </div>
        <div className="flex flex-col w-full items-center justify-center p-8 mt-6">
          {currentView === ECreateOrJoinWorkspaceViews.WORKSPACE_JOIN ? (
            <Invitations
              handleNextStep={handleNextStep}
              handleCurrentViewChange={() => setCurrentView(ECreateOrJoinWorkspaceViews.WORKSPACE_CREATE)}
            />
          ) : currentView === ECreateOrJoinWorkspaceViews.WORKSPACE_CREATE ? (
            <CreateWorkspace
              stepChange={stepChange}
              user={user ?? undefined}
              invitedWorkspaces={invitations.length}
              handleCurrentViewChange={() => setCurrentView(ECreateOrJoinWorkspaceViews.WORKSPACE_JOIN)}
            />
          ) : (
            <div className="flex h-96 w-full items-center justify-center">
              <LogoSpinner />
            </div>
          )}
        </div>
      </div>
      <div className="hidden lg:block relative w-2/5 h-screen overflow-hidden px-6 py-10 sm:px-7 sm:py-14 md:px-14 lg:px-28">
        <SwitchAccountDropdown />
        <div className="absolute inset-0 z-0">
          <Image
            src={resolvedTheme === "dark" ? CreateJoinWorkspaceDark : CreateJoinWorkspace}
            className="h-screen w-auto float-end object-cover"
            alt="Profile setup"
          />
        </div>
      </div>
    </div>
  );
});
