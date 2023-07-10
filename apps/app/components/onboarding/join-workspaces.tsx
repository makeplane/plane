import React, { useState } from "react";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";
// icons
import { CheckCircleIcon } from "@heroicons/react/24/outline";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import { IWorkspaceMemberInvitation } from "types";
// fetch-keys
import { USER_WORKSPACE_INVITATIONS } from "constants/fetch-keys";
// constants
import { ROLE } from "constants/workspace";

type Props = {
  updateLastWorkspace: () => Promise<void>;
};

export const JoinWorkspaces: React.FC<Props> = ({ updateLastWorkspace }) => {
  const [isJoiningWorkspaces, setIsJoiningWorkspaces] = useState(false);
  const [invitationsRespond, setInvitationsRespond] = useState<string[]>([]);

  const { data: invitations, mutate: mutateInvitations } = useSWR(USER_WORKSPACE_INVITATIONS, () =>
    workspaceService.userWorkspaceInvitations()
  );

  const handleInvitation = (
    workspace_invitation: IWorkspaceMemberInvitation,
    action: "accepted" | "withdraw"
  ) => {
    if (action === "accepted") {
      setInvitationsRespond((prevData) => [...prevData, workspace_invitation.id]);
    } else if (action === "withdraw") {
      setInvitationsRespond((prevData) =>
        prevData.filter((item: string) => item !== workspace_invitation.id)
      );
    }
  };

  const submitInvitations = async () => {
    if (invitationsRespond.length <= 0) return;

    setIsJoiningWorkspaces(true);

    await workspaceService
      .joinWorkspaces({ invitations: invitationsRespond })
      .then(async () => {
        await mutateInvitations();

        updateLastWorkspace();
        setIsJoiningWorkspaces(false);
      })
      .catch((err) => {
        console.error(err);
        setIsJoiningWorkspaces(false);
      });
  };

  return (
    <div className="w-full space-y-10">
      <h5 className="text-lg">We see that someone has invited you to</h5>
      <h4 className="text-2xl font-semibold">Join a workspace</h4>
      <div className="md:w-3/5 space-y-4">
        {invitations &&
          invitations.map((invitation) => {
            const isSelected = invitationsRespond.includes(invitation.id);

            return (
              <div
                key={invitation.id}
                className={`flex cursor-pointer items-center gap-2 border py-5 px-3.5 rounded ${
                  isSelected
                    ? "border-custom-primary-100"
                    : "border-custom-border-100 hover:bg-custom-background-80"
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
                  <div className="text-sm font-medium">
                    {truncateText(invitation.workspace.name, 30)}
                  </div>
                  <p className="text-xs text-custom-text-200">{ROLE[invitation.role]}</p>
                </div>
                <span
                  className={`flex-shrink-0 ${
                    isSelected ? "text-custom-primary-100" : "text-custom-text-200"
                  }`}
                >
                  <CheckCircleIcon className="h-5 w-5" />
                </span>
              </div>
            );
          })}
      </div>
      <div className="flex items-center gap-3">
        <PrimaryButton
          type="submit"
          size="md"
          onClick={submitInvitations}
          disabled={isJoiningWorkspaces || invitationsRespond.length === 0}
        >
          Accept & Join
        </PrimaryButton>
        <SecondaryButton size="md" onClick={updateLastWorkspace} outline>
          Skip for now
        </SecondaryButton>
      </div>
    </div>
  );
};
