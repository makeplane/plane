"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// lucide icons
import { ChevronDown, Dot, XCircle } from "lucide-react";
// ui
import { CustomSelect, TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// components
import { ConfirmWorkspaceMemberRemove } from "@/components/workspace";
// constants
import { WORKSPACE_MEMBER_LEAVE } from "@/constants/event-tracker";
import { EUserWorkspaceRoles, ROLE } from "@/constants/workspace";
// hooks
import { useEventTracker, useMember, useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  memberId: string;
};

export const WorkspaceMembersListItem: FC<Props> = observer((props) => {
  const { memberId } = props;
  // states
  const [removeMemberModal, setRemoveMemberModal] = useState(false);
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    // currentUser,
    // currentUserSettings,
    membership: { currentWorkspaceRole, leaveWorkspace },
  } = useUser();
  const { data: currentUser } = useUser();
  const {
    workspace: { updateMember, removeMemberFromWorkspace, getWorkspaceMemberDetails },
  } = useMember();
  const { captureEvent } = useEventTracker();
  const { isMobile } = usePlatformOS();
  // derived values
  const memberDetails = getWorkspaceMemberDetails(memberId);

  const handleLeaveWorkspace = async () => {
    if (!workspaceSlug || !currentUser) return;

    await leaveWorkspace(workspaceSlug.toString())
      .then(() => {
        captureEvent(WORKSPACE_MEMBER_LEAVE, {
          state: "SUCCESS",
          element: "Workspace settings members page",
        });
        router.push("/profile");
      })
      .catch((err: any) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error || "Something went wrong. Please try again.",
        })
      );
  };

  const handleRemoveMember = async () => {
    if (!workspaceSlug || !memberDetails) return;

    await removeMemberFromWorkspace(workspaceSlug.toString(), memberDetails.member.id).catch((err) =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: err?.error || "Something went wrong. Please try again.",
      })
    );
  };

  const handleRemove = async () => {
    if (memberDetails?.member.id === currentUser?.id) await handleLeaveWorkspace();
    else await handleRemoveMember();
  };

  if (!memberDetails) return null;

  // is the member current logged in user
  const isCurrentUser = memberDetails?.member.id === currentUser?.id;
  // is the current logged in user admin
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  // role change access-
  // 1. user cannot change their own role
  // 2. only admin or member can change role
  // 3. user cannot change role of higher role
  const hasRoleChangeAccess =
    currentWorkspaceRole &&
    !isCurrentUser &&
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER].includes(currentWorkspaceRole) &&
    memberDetails.role <= currentWorkspaceRole;

  return (
    <>
      <ConfirmWorkspaceMemberRemove
        isOpen={removeMemberModal}
        onClose={() => setRemoveMemberModal(false)}
        userDetails={{
          id: memberDetails.member.id,
          display_name: `${memberDetails.member.display_name}`,
        }}
        onSubmit={handleRemove}
      />
      <div className="group w-full flex items-center justify-between px-3 py-4 hover:bg-custom-background-90">
        <div className="flex w-full items-center gap-x-4 gap-y-2">
          {memberDetails.member.avatar && memberDetails.member.avatar.trim() !== "" ? (
            <Link href={`/${workspaceSlug}/profile/${memberDetails.member.id}`}>
              <span className="relative flex h-10 w-10 items-center justify-center rounded p-4 capitalize text-white">
                <img
                  src={memberDetails.member.avatar}
                  className="absolute left-0 top-0 h-full w-full rounded object-cover"
                  alt={memberDetails.member.display_name || memberDetails.member.email}
                />
              </span>
            </Link>
          ) : (
            <Link href={`/${workspaceSlug}/profile/${memberDetails.member.id}`}>
              <span className="relative flex h-10 w-10 items-center justify-center rounded bg-gray-700 p-4 capitalize text-white">
                {(memberDetails.member.email ?? memberDetails.member.display_name ?? "?")[0]}
              </span>
            </Link>
          )}
          <div className="w-full flex items-center justify-between">
            <div className="truncate">
              <Link href={`/${workspaceSlug}/profile/${memberDetails.member.id}`} className="truncate">
                <div className="w-full truncate">
                  <span className="text-sm font-medium truncate">
                    {memberDetails.member.first_name} {memberDetails.member.last_name}
                  </span>
                </div>
              </Link>
              <div className="flex flex-col sm:flex-row items-start sm:items-center truncate">
                <p className="text-xs text-custom-text-300">{memberDetails.member.display_name}</p>
                {isAdmin && (
                  <>
                    <Dot height={16} width={16} className="text-custom-text-300 hidden sm:block" />
                    <p className="text-xs text-custom-text-300 line-clamp-1 truncate">{memberDetails.member.email}</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2 text-xs">
              <CustomSelect
                customButton={
                  <div className="item-center flex gap-1 rounded px-2 py-0.5">
                    <span
                      className={`flex items-center rounded text-xs font-medium ${
                        hasRoleChangeAccess ? "" : "text-custom-sidebar-text-400"
                      }`}
                    >
                      {ROLE[memberDetails.role]}
                    </span>
                    {hasRoleChangeAccess && (
                      <span className="grid place-items-center">
                        <ChevronDown className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                }
                value={memberDetails.role}
                onChange={(value: EUserWorkspaceRoles) => {
                  if (!workspaceSlug || !value) return;

                  updateMember(workspaceSlug.toString(), memberDetails.member.id, {
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
              <Tooltip
                isMobile={isMobile}
                tooltipContent={isCurrentUser ? "Leave workspace" : "Remove member"}
                disabled={!isAdmin && !isCurrentUser}
              >
                <button
                  type="button"
                  onClick={() => setRemoveMemberModal(true)}
                  className={
                    isAdmin || isCurrentUser
                      ? "pointer-events-none md:opacity-0 group-hover:pointer-events-auto md:group-hover:opacity-100"
                      : "pointer-events-none hidden md:opacity-0 md:block"
                  }
                >
                  <XCircle className="h-3.5 w-3.5 text-red-500" strokeWidth={2} />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
