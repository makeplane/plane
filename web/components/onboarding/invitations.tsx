// react
import React, { useState } from "react";
// components
import { Button } from "@plane/ui";

// helpers
import { truncateText } from "helpers/string.helper";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { WorkspaceService } from "services/workspace.service";
// swr
import useSWR, { mutate } from "swr";
// contants
import { USER_WORKSPACES, USER_WORKSPACE_INVITATIONS } from "constants/fetch-keys";
import { ROLE } from "constants/workspace";
// types
import { IWorkspaceMemberInvitation } from "types";
// icons
import { CheckCircle2 } from "lucide-react";

type Props = {
  handleNextStep: () => void;
  updateLastWorkspace: () => void;
};
const workspaceService = new WorkspaceService();

const Invitations: React.FC<Props> = (props) => {
  const { handleNextStep, updateLastWorkspace } = props;
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);

  const { workspace: workspaceStore } = useMobxStore();

  const { data: invitations, mutate: mutateInvitations } = useSWR(USER_WORKSPACE_INVITATIONS, () =>
    workspaceService.userWorkspaceInvitations()
  );

  const handleInvitation = (workspace_invitation: IWorkspaceMemberInvitation, action: "accepted" | "withdraw") => {
    if (action === "accepted") {
      setInvitationsRespond((prevData) => [...prevData, workspace_invitation.id]);
    } else if (action === "withdraw") {
      setInvitationsRespond((prevData) => prevData.filter((item: string) => item !== workspace_invitation.id));
    }
  };

  const submitInvitations = async () => {
    if (invitationsRespond.length <= 0) return;

    setIsJoiningWorkspaces(true);

    await workspaceService
      .joinWorkspaces({ invitations: invitationsRespond })
      .then(async () => {
        await mutateInvitations();
        await workspaceStore.fetchWorkspaces();
        await mutate(USER_WORKSPACES);
        await updateLastWorkspace();
        await handleNextStep();
      })
      .finally(() => setIsJoiningWorkspaces(false));
  };

  return (
    <div className="space-y-4">
      <p className="font-semibold pb-2 text-xl sm:text-2xl">Choose a workspace to join </p>
      <div>
        {invitations &&
          invitations.map((invitation) => {
            const isSelected = invitationsRespond.includes(invitation.id);
            return (
              <div
                key={invitation.id}
                className={`flex cursor-pointer items-center gap-2 border p-3.5 rounded ${
                  isSelected ? "border-custom-primary-100" : "border-custom-border-200 hover:bg-custom-primary-10"
                }`}
                onClick={() => handleInvitation(invitation, isSelected ? "withdraw" : "accepted")}
              >
                <div className="flex-shrink-0">
                  <div className="grid place-items-center h-9 w-9 rounded">
                    {invitation.workspace.logo && invitation.workspace.logo !== "" ? (
                      <img
                        src={invitation.workspace.logo}
                        height="100%"
                        width="100%"
                        className="rounded"
                        alt={invitation.workspace.name}
                      />
                    ) : (
                      <span className="grid place-items-center h-9 w-9 py-1.5 px-3 rounded bg-gray-700 uppercase text-white">
                        {invitation.workspace.name[0]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{truncateText(invitation.workspace.name, 30)}</div>
                  <p className="text-xs text-custom-text-200">{ROLE[invitation.role]}</p>
                </div>
                <span className={`flex-shrink-0 ${isSelected ? "text-custom-primary-100" : "text-custom-text-200"}`}>
                  <CheckCircle2 className="h-5 w-5" />
                </span>
              </div>
            );
          })}
      </div>

      <Button variant="primary" onClick={submitInvitations}>
        {isJoiningWorkspaces ? "Joining..." : "Join your team"}
      </Button>
    </div>
  );
};

export default Invitations;
