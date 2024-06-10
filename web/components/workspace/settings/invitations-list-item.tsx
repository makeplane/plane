"use client";

import { useState, FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronDown, XCircle } from "lucide-react";
// ui
import { CustomSelect, Tooltip, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ConfirmWorkspaceMemberRemove } from "@/components/workspace";
// constants
import { EUserWorkspaceRoles, ROLE } from "@/constants/workspace";
// hooks
import { useMember, useUser } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  invitationId: string;
};

export const WorkspaceInvitationsListItem: FC<Props> = observer((props) => {
  const { invitationId } = props;
  // states
  const [removeMemberModal, setRemoveMemberModal] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    membership: { currentWorkspaceMemberInfo, currentWorkspaceRole },
  } = useUser();
  const {
    workspace: { updateMemberInvitation, deleteMemberInvitation, getWorkspaceInvitationDetails },
  } = useMember();
  const { isMobile } = usePlatformOS();
  // derived values
  const invitationDetails = getWorkspaceInvitationDetails(invitationId);

  const handleRemoveInvitation = async () => {
    if (!workspaceSlug || !invitationDetails) return;

    await deleteMemberInvitation(workspaceSlug.toString(), invitationDetails.id)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Invitation removed successfully.",
        });
      })
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error || "Something went wrong. Please try again.",
        })
      );
  };

  if (!invitationDetails) return null;

  // is the current logged in user admin
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  // role change access-
  // 1. user cannot change their own role
  // 2. only admin or member can change role
  // 3. user cannot change role of higher role
  const hasRoleChangeAccess =
    currentWorkspaceRole && [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER].includes(currentWorkspaceRole);

  if (!currentWorkspaceMemberInfo) return null;

  return (
    <>
      <ConfirmWorkspaceMemberRemove
        isOpen={removeMemberModal}
        onClose={() => setRemoveMemberModal(false)}
        userDetails={{
          id: invitationDetails.id,
          display_name: `${invitationDetails.email}`,
        }}
        onSubmit={handleRemoveInvitation}
      />
      <div className="group flex items-center justify-between px-3 py-4 hover:bg-custom-background-90">
        <div className="flex items-center gap-x-4 gap-y-2">
          <span className="relative flex h-10 w-10 items-center justify-center rounded bg-gray-700 p-4 capitalize text-white">
            {(invitationDetails.email ?? "?")[0]}
          </span>
          <div>
            <h4 className="cursor-default text-sm">{invitationDetails.email}</h4>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center justify-center rounded bg-yellow-500/20 px-2.5 py-1 text-center text-xs font-medium text-yellow-500">
            <p>Pending</p>
          </div>
          <CustomSelect
            customButton={
              <div className="item-center flex gap-1 rounded px-2 py-0.5">
                <span
                  className={`flex items-center rounded text-xs font-medium ${
                    hasRoleChangeAccess ? "" : "text-custom-sidebar-text-400"
                  }`}
                >
                  {ROLE[invitationDetails.role]}
                </span>
                {hasRoleChangeAccess && (
                  <span className="grid place-items-center">
                    <ChevronDown className="h-3 w-3" />
                  </span>
                )}
              </div>
            }
            value={invitationDetails.role}
            onChange={(value: EUserWorkspaceRoles) => {
              if (!workspaceSlug || !value) return;

              updateMemberInvitation(workspaceSlug.toString(), invitationDetails.id, {
                role: value,
              }).catch(() => {
                setToast({
                  type: TOAST_TYPE.ERROR,
                  title: "Error!",
                  message: "An error occurred while updating member role. Please try again.",
                });
              });
            }}
            disabled={!hasRoleChangeAccess}
            placement="bottom-end"
          >
            {Object.keys(ROLE).map((key) => {
              if (currentWorkspaceRole && currentWorkspaceRole !== 20 && currentWorkspaceRole < parseInt(key))
                return null;

              return (
                <CustomSelect.Option key={key} value={parseInt(key, 10)}>
                  <>{ROLE[parseInt(key) as keyof typeof ROLE]}</>
                </CustomSelect.Option>
              );
            })}
          </CustomSelect>
          <Tooltip tooltipContent="Remove member" disabled={!isAdmin} isMobile={isMobile}>
            <button
              type="button"
              onClick={() => setRemoveMemberModal(true)}
              className={`pointer-events-none opacity-0 ${
                isAdmin ? "group-hover:pointer-events-auto group-hover:opacity-100" : ""
              }`}
            >
              <XCircle className="h-3.5 w-3.5 text-red-500" strokeWidth={2} />
            </button>
          </Tooltip>
        </div>
      </div>
    </>
  );
});
