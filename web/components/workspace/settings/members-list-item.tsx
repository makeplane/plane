import { useState, FC } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
import { ChevronDown, Dot, XCircle } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
// components
import { ConfirmWorkspaceMemberRemove } from "components/workspace";
// ui
import { CustomSelect, Tooltip } from "@plane/ui";
// types
import { TUserWorkspaceRole } from "types";
// constants
import { EUserWorkspaceRoles, ROLE } from "constants/workspace";

type Props = {
  member: {
    id: string;
    memberId: string;
    avatar: string;
    first_name: string;
    last_name: string;
    email: string | undefined;
    display_name: string;
    role: TUserWorkspaceRole;
    status: boolean;
    member: boolean;
    accountCreated: boolean;
  };
};

export const WorkspaceMembersListItem: FC<Props> = observer((props) => {
  const { member } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const {
    workspaceMember: { removeMember, updateMember, updateMemberInvitation, deleteWorkspaceInvitation },
    user: { currentWorkspaceMemberInfo, currentWorkspaceRole, currentUser, currentUserSettings, leaveWorkspace },
  } = useMobxStore();
  // states
  const [removeMemberModal, setRemoveMemberModal] = useState(false);
  // hooks
  const { setToastAlert } = useToast();

  const handleLeaveWorkspace = async () => {
    if (!workspaceSlug || !currentUserSettings) return;

    await leaveWorkspace(workspaceSlug.toString())
      .then(() => router.push("/profile"))
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error",
          message: err?.error || "Something went wrong. Please try again.",
        })
      );
  };

  const handleRemoveMember = async () => {
    if (!workspaceSlug) return;

    await removeMember(workspaceSlug.toString(), member.id).catch((err) =>
      setToastAlert({
        type: "error",
        title: "Error",
        message: err?.error || "Something went wrong. Please try again.",
      })
    );
  };

  const handleRemoveInvitation = async () => {
    if (!workspaceSlug) return;

    await deleteWorkspaceInvitation(workspaceSlug.toString(), member.id)
      .then(() =>
        setToastAlert({
          type: "success",
          title: "Success",
          message: "Invitation removed successfully.",
        })
      )
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error",
          message: err?.error || "Something went wrong. Please try again.",
        })
      )
      .finally(() =>
        mutate(`WORKSPACE_INVITATIONS_${workspaceSlug.toString()}`, (prevData: any) => {
          if (!prevData) return prevData;

          return prevData.filter((item: any) => item.id !== member.id);
        })
      );
  };

  const handleRemove = async () => {
    if (member.member) {
      const memberId = member.memberId;

      if (memberId === currentUser?.id) await handleLeaveWorkspace();
      else await handleRemoveMember();
    } else await handleRemoveInvitation();
  };

  // is the member current logged in user
  const isCurrentUser = member.memberId === currentWorkspaceMemberInfo?.member;
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
    member.role <= currentWorkspaceRole;

  if (!currentWorkspaceMemberInfo) return null;

  return (
    <>
      <ConfirmWorkspaceMemberRemove
        isOpen={removeMemberModal}
        onClose={() => setRemoveMemberModal(false)}
        data={member}
        onSubmit={handleRemove}
      />
      <div className="group flex items-center justify-between px-3 py-4 hover:bg-custom-background-90">
        <div className="flex items-center gap-x-4 gap-y-2">
          {member.avatar && member.avatar !== "" ? (
            <Link href={`/${workspaceSlug}/profile/${member.memberId}`}>
              <span className="relative flex h-10 w-10 items-center justify-center rounded p-4 capitalize text-white">
                <img
                  src={member.avatar}
                  className="absolute left-0 top-0 h-full w-full rounded object-cover"
                  alt={member.display_name || member.email}
                />
              </span>
            </Link>
          ) : (
            <Link href={`/${workspaceSlug}/profile/${member.memberId}`}>
              <span className="relative flex h-10 w-10 items-center justify-center rounded bg-gray-700 p-4 capitalize text-white">
                {(member.email ?? member.display_name ?? "?")[0]}
              </span>
            </Link>
          )}
          <div>
            {member.member ? (
              <Link href={`/${workspaceSlug}/profile/${member.memberId}`}>
                <span className="text-sm font-medium">
                  {member.first_name} {member.last_name}
                </span>
              </Link>
            ) : (
              <h4 className="cursor-default text-sm">{member.display_name || member.email}</h4>
            )}
            <div className="flex items-center">
              <p className="text-xs text-custom-text-300">{member.display_name}</p>
              {isAdmin && (
                <>
                  <Dot height={16} width={16} className="text-custom-text-300" />
                  <p className="text-xs text-custom-text-300">{member.email}</p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {!member?.status && (
            <div className="flex items-center justify-center rounded bg-yellow-500/20 px-2.5 py-1 text-center text-xs font-medium text-yellow-500">
              <p>Pending</p>
            </div>
          )}
          {member?.status && !member?.accountCreated && (
            <div className="flex items-center justify-center rounded bg-blue-500/20 px-2.5 py-1 text-center text-xs font-medium text-blue-500">
              <p>Account not created</p>
            </div>
          )}
          <CustomSelect
            customButton={
              <div className="item-center flex gap-1 rounded px-2 py-0.5">
                <span
                  className={`flex items-center rounded text-xs font-medium ${
                    hasRoleChangeAccess ? "" : "text-custom-sidebar-text-400"
                  }`}
                >
                  {ROLE[member.role as keyof typeof ROLE]}
                </span>
                {hasRoleChangeAccess && (
                  <span className="grid place-items-center">
                    <ChevronDown className="h-3 w-3" />
                  </span>
                )}
              </div>
            }
            value={member.role}
            onChange={(value: TUserWorkspaceRole | undefined) => {
              if (!workspaceSlug || !value) return;

              if (!member?.status)
                updateMemberInvitation(workspaceSlug.toString(), member.id, {
                  role: value,
                }).catch(() => {
                  setToastAlert({
                    type: "error",
                    title: "Error!",
                    message: "An error occurred while updating member role. Please try again.",
                  });
                });
              else
                updateMember(workspaceSlug.toString(), member.id, {
                  role: value,
                }).catch(() => {
                  setToastAlert({
                    type: "error",
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
            tooltipContent={isCurrentUser ? "Leave workspace" : "Remove member"}
            disabled={!isAdmin && !isCurrentUser}
          >
            <button
              type="button"
              onClick={() => setRemoveMemberModal(true)}
              className={
                isAdmin || isCurrentUser
                  ? "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
                  : "pointer-events-none opacity-0"
              }
            >
              <XCircle className="h-3.5 w-3.5 text-red-500" strokeWidth={2} />
            </button>
          </Tooltip>
        </div>
      </div>
    </>
  );
});
