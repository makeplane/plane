import { useState } from "react";
// plane imports
import { ROLE } from "@plane/constants";
// types
import { Button } from "@plane/propel/button";
import type { IWorkspaceMemberInvitation } from "@plane/types";
// ui
import { Checkbox, Spinner } from "@plane/ui";
import { truncateText } from "@plane/utils";
// constants
// helpers
import { WorkspaceLogo } from "@/components/workspace/logo";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserSettings } from "@/hooks/store/user";
// services
import { WorkspaceService } from "@/plane-web/services";

type Props = {
  invitations: IWorkspaceMemberInvitation[];
  handleNextStep: () => Promise<void>;
  handleCurrentViewChange: () => void;
};
const workspaceService = new WorkspaceService();

export function Invitations(props: Props) {
  const { invitations, handleNextStep, handleCurrentViewChange } = props;
  // states
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);
  // store hooks
  const { fetchWorkspaces } = useWorkspace();
  const { fetchCurrentUserSettings } = useUserSettings();

  const handleInvitation = (workspace_invitation: IWorkspaceMemberInvitation, action: "accepted" | "withdraw") => {
    if (action === "accepted") {
      setInvitationsRespond((prevData) => [...prevData, workspace_invitation.id]);
    } else if (action === "withdraw") {
      setInvitationsRespond((prevData) => prevData.filter((item: string) => item !== workspace_invitation.id));
    }
  };

  const submitInvitations = async () => {
    const invitation = invitations?.find((invitation) => invitation.id === invitationsRespond[0]);
    if (invitationsRespond.length <= 0 && !invitation?.role) return;
    setIsJoiningWorkspaces(true);
    try {
      await workspaceService.joinWorkspaces({ invitations: invitationsRespond });
      await fetchWorkspaces();
      await fetchCurrentUserSettings();
      await handleNextStep();
    } catch (error) {
      console.error(error);
      setIsJoiningWorkspaces(false);
    }
  };

  return invitations && invitations.length > 0 ? (
    <div className="space-y-4">
      <div className="text-center space-y-1 py-4 mx-auto">
        <h3 className="text-24 font-bold text-primary">You are invited!</h3>
        <p className="font-medium text-placeholder">Accept the invites to collaborate with your team.</p>
      </div>
      <div>
        {invitations &&
          invitations.length > 0 &&
          invitations.map((invitation) => {
            const isSelected = invitationsRespond.includes(invitation.id);
            const invitedWorkspace = invitation.workspace;
            return (
              <div
                key={invitation.id}
                className={`flex cursor-pointer items-center gap-2 rounded-sm border p-3.5 border-subtle hover:bg-surface-2`}
                onClick={() => handleInvitation(invitation, isSelected ? "withdraw" : "accepted")}
              >
                <div className="flex-shrink-0">
                  <WorkspaceLogo
                    logo={invitedWorkspace?.logo_url}
                    name={invitedWorkspace?.name}
                    classNames="size-9 flex-shrink-0"
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
      <Button
        variant="primary"
        size="xl"
        className="w-full"
        onClick={submitInvitations}
        disabled={isJoiningWorkspaces || !invitationsRespond.length}
      >
        {isJoiningWorkspaces ? <Spinner height="20px" width="20px" /> : "Continue to workspace"}
      </Button>
      <div className="mx-auto mt-4 flex items-center sm:w-96">
        <hr className="w-full border-strong" />
        <p className="mx-3 flex-shrink-0 text-center text-13 text-placeholder">or</p>
        <hr className="w-full border-strong" />
      </div>
      <Button
        variant="ghost"
        size="xl"
        className="w-full text-14 bg-surface-2"
        onClick={handleCurrentViewChange}
        disabled={isJoiningWorkspaces}
      >
        Create your own workspace
      </Button>
    </div>
  ) : (
    <div>No Invitations found</div>
  );
}
