import { useState } from "react";
// plane imports
import { ROLE } from "@plane/constants";
import { Button } from "@plane/propel/button";
import type { IWorkspaceMemberInvitation } from "@plane/types";
import { Checkbox, Spinner } from "@plane/ui";
import { truncateText } from "@plane/utils";
// constants
import { WorkspaceLogo } from "@/components/workspace/logo";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserSettings } from "@/hooks/store/user";
// services
import { WorkspaceService } from "@/plane-web/services";
// local components
import { CommonOnboardingHeader } from "../common";

type Props = {
  invitations: IWorkspaceMemberInvitation[];
  handleNextStep: () => Promise<void>;
  handleCurrentViewChange: () => void;
};
const workspaceService = new WorkspaceService();

export function WorkspaceJoinInvitesStep(props: Props) {
  const { invitations, handleNextStep, handleCurrentViewChange } = props;
  // states
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);
  // store hooks
  const { fetchWorkspaces } = useWorkspace();
  const { fetchCurrentUserSettings } = useUserSettings();

  // handle invitation
  const handleInvitation = (workspace_invitation: IWorkspaceMemberInvitation, action: "accepted" | "withdraw") => {
    if (action === "accepted") {
      setInvitationsRespond((prevData) => [...prevData, workspace_invitation.id]);
    } else if (action === "withdraw") {
      setInvitationsRespond((prevData) => prevData.filter((item: string) => item !== workspace_invitation.id));
    }
  };

  // submit invitations
  const submitInvitations = async () => {
    const invitation = invitations?.find((invitation) => invitation.id === invitationsRespond[0]);

    if (invitationsRespond.length <= 0 && !invitation?.role) return;

    setIsJoiningWorkspaces(true);

    try {
      await workspaceService.joinWorkspaces({ invitations: invitationsRespond });
      await fetchWorkspaces();
      await fetchCurrentUserSettings();
      await handleNextStep();
    } catch (error: any) {
      console.error(error);
      setIsJoiningWorkspaces(false);
    }
  };

  return invitations && invitations.length > 0 ? (
    <div className="flex flex-col gap-10">
      <CommonOnboardingHeader title="Join invites or create a workspace" description="All your work — unified." />
      <div className="flex flex-col gap-3">
        {invitations &&
          invitations.length > 0 &&
          invitations.map((invitation) => {
            const isSelected = invitationsRespond.includes(invitation.id);
            const invitedWorkspace = invitation.workspace;
            return (
              <div
                key={invitation.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 border-subtle hover:bg-surface-2`}
                onClick={() => handleInvitation(invitation, isSelected ? "withdraw" : "accepted")}
              >
                <div className="flex-shrink-0">
                  <WorkspaceLogo
                    logo={invitedWorkspace?.logo_url}
                    name={invitedWorkspace?.name}
                    classNames="size-8 flex-shrink-0 rounded-lg"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-13 font-medium">{truncateText(invitedWorkspace?.name, 30)}</div>
                  <p className="text-11 text-secondary">{ROLE[invitation.role]}</p>
                </div>
                <span className={`flex-shrink-0`}>
                  <Checkbox checked={isSelected} />
                </span>
              </div>
            );
          })}
      </div>
      <div className="flex flex-col gap-4">
        <Button
          variant="primary"
          size="xl"
          className="w-full"
          onClick={submitInvitations}
          disabled={isJoiningWorkspaces || !invitationsRespond.length}
        >
          {isJoiningWorkspaces ? <Spinner height="20px" width="20px" /> : "Continue"}
        </Button>
        <Button
          variant="ghost"
          size="xl"
          className="w-full"
          onClick={handleCurrentViewChange}
          disabled={isJoiningWorkspaces}
        >
          Create new workspace
        </Button>
      </div>
    </div>
  ) : (
    <div>No Invitations found</div>
  );
}
