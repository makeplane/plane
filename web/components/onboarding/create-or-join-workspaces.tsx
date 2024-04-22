import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
// icons
import { Sparkles } from "lucide-react";
// types
import { IWorkspaceMemberInvitation, TOnboardingSteps } from "@plane/types";
// ui
import { Spinner } from "@plane/ui";
// components
import { Invitations, OnboardingHeader, SwitchOrDeleteAccountDropdown, CreateWorkspace } from "@/components/onboarding";
// hooks
import { useUser } from "@/hooks/store";
// assets
import createJoinWorkspace from "public/onboarding/create-join-workspace.png";

export enum ECreateOrJoinWorkspaceViews {
  WORKSPACE_CREATE = "WORKSPACE_CREATE",
  WORKSPACE_JOIN = "WORKSPACE_JOIN",
}

type Props = {
  invitations: IWorkspaceMemberInvitation[];
  totalSteps: number;
  stepChange: (steps: Partial<TOnboardingSteps>) => Promise<void>;
};

export const CreateOrJoinWorkspaces: React.FC<Props> = observer((props) => {
  const { invitations, totalSteps, stepChange } = props;
  // states
  const [currentView, setCurrentView] = useState<ECreateOrJoinWorkspaceViews | null>(null);
  // store hooks
  const { data: user } = useUser();

  useEffect(() => {
    if (invitations.length > 0) {
      setCurrentView(ECreateOrJoinWorkspaceViews.WORKSPACE_JOIN);
    } else {
      setCurrentView(ECreateOrJoinWorkspaceViews.WORKSPACE_CREATE);
    }
  }, [invitations]);

  const handleNextStep = async () => {
    if (!user) return;
    await stepChange({ workspace_join: true, workspace_create: true });
  };

  return (
    <div className="flex h-full w-full">
      <div className="w-full lg:w-3/5 h-full overflow-auto px-6 py-10 sm:px-7 sm:py-14 md:px-14 lg:px-28">
        <div className="flex items-center justify-between">
          <OnboardingHeader currentStep={2} totalSteps={totalSteps} />
          <div className="shrink-0 lg:hidden">
            <SwitchOrDeleteAccountDropdown />
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
              <Spinner />
            </div>
          )}
        </div>
      </div>
      <div className="hidden lg:block relative w-2/5 px-6 py-10 sm:px-7 sm:py-14 md:px-14 lg:px-28 bg-onboarding-gradient-100">
        <SwitchOrDeleteAccountDropdown />
        <div className="absolute right-0 bottom-0 flex flex-col items-start justify-end w-2/3 ">
          <div className="flex gap-2 pb-1 pr-2 text-base text-custom-primary-300 font-medium self-end">
            <Sparkles className="h-6 w-6" />
            Workspace is the hub for all work happening in your company.
          </div>
          <Image src={createJoinWorkspace} alt="create-join-workspace" />
        </div>
      </div>
    </div>
  );
});
