import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
// components
import { ConfirmProjectMemberRemove } from "components/project";
// ui
import { CustomSelect, Tooltip } from "@plane/ui";
// icons
import { ChevronDown, Dot, XCircle } from "lucide-react";
// constants
import { ROLE } from "constants/workspace";
// types
import { TUserProjectRole } from "types";

type Props = {
  member: any;
};

export const ProjectMemberListItem: React.FC<Props> = observer((props) => {
  const { member } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // states
  const [selectedRemoveMember, setSelectedRemoveMember] = useState<any | null>(null);
  const [selectedInviteRemoveMember, setSelectedInviteRemoveMember] = useState<any | null>(null);
  // store
  const {
    user: userStore,
    projectMember: {
      projectMembers,
      fetchProjectMembers,
      removeMemberFromProject,
      updateMember,
      deleteProjectInvitation,
    },
  } = useMobxStore();
  // hooks
  const { setToastAlert } = useToast();
  // fetching project members
  useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_${projectId.toString().toUpperCase()}` : null,
    workspaceSlug && projectId ? () => fetchProjectMembers(workspaceSlug.toString(), projectId.toString()) : null
  );
  // derived values
  const user = userStore.currentUser;
  const { currentProjectMemberInfo, currentProjectRole } = userStore;
  const isAdmin = currentProjectRole === 20;
  const currentUser = projectMembers?.find((item) => item.member.id === user?.id);

  return (
    <>
      <ConfirmProjectMemberRemove
        isOpen={Boolean(selectedRemoveMember) || Boolean(selectedInviteRemoveMember)}
        onClose={() => {
          setSelectedRemoveMember(null);
          setSelectedInviteRemoveMember(null);
        }}
        data={selectedRemoveMember ?? selectedInviteRemoveMember}
        handleDelete={async () => {
          if (!workspaceSlug || !projectId) return;

          // if the user is a member
          if (selectedRemoveMember) {
            await removeMemberFromProject(workspaceSlug.toString(), projectId.toString(), selectedRemoveMember.id);
          }
          // if the user is an invite
          if (selectedInviteRemoveMember) {
            await deleteProjectInvitation(
              workspaceSlug.toString(),
              projectId.toString(),
              selectedInviteRemoveMember.id
            );
            mutate(`PROJECT_INVITATIONS_${projectId.toString()}`);
          }

          setToastAlert({
            type: "success",
            message: "Member removed successfully",
            title: "Success",
          });
        }}
      />
      <div className="group flex items-center justify-between px-3 py-4 hover:bg-custom-background-90">
        <div className="flex items-center gap-x-4 gap-y-2">
          {member.avatar && member.avatar !== "" ? (
            <Link href={`/${workspaceSlug}/profile/${member.memberId}`}>
              <a className="relative flex h-10 w-10 items-center justify-center rounded p-4 capitalize text-white">
                <img
                  src={member.avatar}
                  alt={member.display_name || member.email}
                  className="absolute top-0 left-0 h-full w-full object-cover rounded"
                />
              </a>
            </Link>
          ) : (
            <Link href={`/${workspaceSlug}/profile/${member.memberId}`}>
              <a className="relative flex h-10 w-10 items-center justify-center rounded p-4 capitalize bg-gray-700 text-white">
                {(member.display_name ?? member.email ?? "?")[0]}
              </a>
            </Link>
          )}

          <div>
            {member.member ? (
              <Link href={`/${workspaceSlug}/profile/${member.memberId}`}>
                <a className="text-sm font-medium">
                  {member.first_name} {member.last_name}
                </a>
              </Link>
            ) : (
              <h4 className="text-sm cursor-default">{member.display_name || member.email}</h4>
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
            <div className="flex items-center justify-center rounded bg-yellow-500/20 px-2.5 py-1 text-center text-xs text-yellow-500 font-medium">
              <p>Pending</p>
            </div>
          )}

          <CustomSelect
            customButton={
              <div className="flex item-center gap-1 px-2 py-0.5 rounded">
                <span
                  className={`flex items-center text-xs font-medium rounded ${
                    member.memberId !== currentProjectMemberInfo?.id ? "" : "text-custom-sidebar-text-400"
                  }`}
                >
                  {ROLE[member.role as keyof typeof ROLE]}
                </span>
                {member.memberId !== currentProjectMemberInfo?.id && (
                  <span className="grid place-items-center">
                    <ChevronDown className="h-3 w-3" />
                  </span>
                )}
              </div>
            }
            value={member.role}
            onChange={(value: TUserProjectRole | undefined) => {
              if (!workspaceSlug || !projectId) return;

              updateMember(workspaceSlug.toString(), projectId.toString(), member.id, {
                role: value,
              }).catch((err) => {
                const error = err.error;
                const errorString = Array.isArray(error) ? error[0] : error;

                setToastAlert({
                  type: "error",
                  title: "Error!",
                  message: errorString ?? "An error occurred while updating member role. Please try again.",
                });
              });
            }}
            disabled={
              member.memberId === user?.id ||
              !member.member ||
              (currentUser && currentUser.role !== 20 && currentUser.role < member.role)
            }
            placement="bottom-end"
          >
            {Object.keys(ROLE).map((key) => {
              if (currentProjectRole && currentProjectRole !== 20 && currentProjectRole < parseInt(key)) return null;

              return (
                <CustomSelect.Option key={key} value={parseInt(key, 10)}>
                  <>{ROLE[parseInt(key) as keyof typeof ROLE]}</>
                </CustomSelect.Option>
              );
            })}
          </CustomSelect>
          {isAdmin && (
            <Tooltip
              tooltipContent={member.memberId === currentProjectMemberInfo?.member ? "Leave project" : "Remove member"}
            >
              <button
                type="button"
                onClick={() => {
                  if (member.member) setSelectedRemoveMember(member);
                  else setSelectedInviteRemoveMember(member);
                }}
                className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
              >
                <XCircle className="h-3.5 w-3.5 text-custom-text-400" strokeWidth={2} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </>
  );
});
