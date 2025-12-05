import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { OctagonAlert } from "lucide-react";
// plane imports
import type { IWorkspaceMemberInvitation, TOnboardingSteps } from "@plane/types";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
// hooks
import { useUser } from "@/hooks/store/user";
// plane web helpers
import { getIsWorkspaceCreationDisabled } from "@/plane-web/helpers/instance.helper";
// local imports
import { CreateWorkspace } from "./create-workspace";
import { Invitations } from "./invitations";
import { SwitchAccountDropdown } from "./switch-account-dropdown";

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

export const CreateOrJoinWorkspaces = observer(function CreateOrJoinWorkspaces(props: Props) {
  const { invitations, totalSteps, stepChange, finishOnboarding } = props;
  // states
  const [currentView, setCurrentView] = useState<ECreateOrJoinWorkspaceViews | null>(null);
  // store hooks
  const { data: user } = useUser();
  // derived values
  const isWorkspaceCreationEnabled = getIsWorkspaceCreationDisabled() === false;

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
        <div className="flex flex-col w-full items-center justify-center p-8 mt-6">
          {currentView === ECreateOrJoinWorkspaceViews.WORKSPACE_JOIN ? (
            <Invitations
              invitations={invitations}
              handleNextStep={handleNextStep}
              handleCurrentViewChange={() => setCurrentView(ECreateOrJoinWorkspaceViews.WORKSPACE_CREATE)}
            />
          ) : currentView === ECreateOrJoinWorkspaceViews.WORKSPACE_CREATE ? (
            isWorkspaceCreationEnabled ? (
              <CreateWorkspace
                stepChange={stepChange}
                user={user ?? undefined}
                invitedWorkspaces={invitations.length}
                handleCurrentViewChange={() => setCurrentView(ECreateOrJoinWorkspaceViews.WORKSPACE_JOIN)}
              />
            ) : (
              <div className="flex h-96 w-full items-center justify-center">
                <div className="flex gap-2.5 w-full items-start justify-center text-13 leading-5 mt-4 px-6 py-4 rounded-sm border border-accent-strong/20 bg-accent-primary/10 text-accent-secondary">
                  <OctagonAlert className="flex-shrink-0 size-5 mt-1" />
                  <span>
                    You don&apos;t seem to have any invites to a workspace and your instance admin has restricted
                    creation of new workspaces. Please ask a workspace owner or admin to invite you to a workspace first
                    and come back to this screen to join.
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="flex h-96 w-full items-center justify-center">
              <LogoSpinner />
            </div>
          )}
        </div>
      </div>
      <SwitchAccountDropdown />
    </div>
  );
});
