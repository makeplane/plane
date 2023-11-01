import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { ProjectInvitationService } from "services/project";
// hooks
import useToast from "hooks/use-toast";
// components
import { ConfirmProjectMemberRemove } from "components/project";
// ui
import { CustomMenu, CustomSelect } from "@plane/ui";
// icons
import { ChevronDown, X } from "lucide-react";
// constants
import { ROLE } from "constants/workspace";

// services
const projectInvitationService = new ProjectInvitationService();

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
  const { user: userStore, project: projectStore } = useMobxStore();
  // hooks
  const { setToastAlert } = useToast();
  // fetching project members
  useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_${projectId.toString().toUpperCase()}` : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectMembers(workspaceSlug.toString(), projectId.toString())
      : null
  );
  // derived values
  const user = userStore.currentUser;
  const { currentProjectRole } = userStore;
  const isAdmin = currentProjectRole === 20;
  const isOwner = currentProjectRole === 20;
  const projectMembers = projectStore.members?.[projectId?.toString()!];
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
            await projectStore.removeMemberFromProject(
              workspaceSlug.toString(),
              projectId.toString(),
              selectedRemoveMember
            );
          }
          // if the user is an invite
          if (selectedInviteRemoveMember) {
            await projectInvitationService.deleteProjectInvitation(
              workspaceSlug.toString(),
              projectId.toString(),
              selectedInviteRemoveMember
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

      <div key={member.id} className="flex items-center justify-between px-3.5 py-[18px]">
        <div className="flex items-center gap-x-6 gap-y-2">
          {member.avatar && member.avatar !== "" ? (
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg p-4 capitalize text-white">
              <img
                src={member.avatar}
                alt={member.display_name}
                className="absolute top-0 left-0 h-full w-full object-cover rounded-lg"
              />
            </div>
          ) : member.display_name || member.email ? (
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700 p-4 capitalize text-white">
              {(member.display_name || member.email)?.charAt(0)}
            </div>
          ) : (
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700 p-4 capitalize text-white">
              ?
            </div>
          )}
          <div>
            {member.member ? (
              <Link href={`/${workspaceSlug}/profile/${member.memberId}`}>
                <a className="text-sm">
                  <span>
                    {member.first_name} {member.last_name}
                  </span>
                  <span className="text-custom-text-300 text-sm ml-2">({member.display_name})</span>
                </a>
              </Link>
            ) : (
              <h4 className="text-sm">{member.display_name || member.email}</h4>
            )}
            {isOwner && <p className="mt-0.5 text-xs text-custom-sidebar-text-300">{member.email}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {!member.member && (
            <div className="mr-2 flex items-center justify-center rounded-full bg-yellow-500/20 px-2 py-1 text-center text-xs text-yellow-500">
              Pending
            </div>
          )}
          <CustomSelect
            customButton={
              <div className="flex item-center gap-1">
                <span
                  className={`flex items-center text-sm font-medium ${
                    member.memberId !== user?.id ? "" : "text-custom-sidebar-text-400"
                  }`}
                >
                  {ROLE[member.role as keyof typeof ROLE]}
                </span>
                {member.memberId !== user?.id && <ChevronDown className="h-4 w-4" />}
              </div>
            }
            value={member.role}
            onChange={(value: 5 | 10 | 15 | 20 | undefined) => {
              if (!workspaceSlug || !projectId) return;

              projectStore
                .updateMember(workspaceSlug.toString(), projectId.toString(), member.id, {
                  role: value,
                })
                .catch((err) => {
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
          >
            {Object.keys(ROLE).map((key) => {
              if (currentUser && currentUser.role !== 20 && currentUser.role < parseInt(key)) return null;

              return (
                <CustomSelect.Option key={key} value={key}>
                  <>{ROLE[parseInt(key) as keyof typeof ROLE]}</>
                </CustomSelect.Option>
              );
            })}
          </CustomSelect>
          <CustomMenu ellipsis disabled={!isAdmin}>
            <CustomMenu.MenuItem
              onClick={() => {
                if (member.member) setSelectedRemoveMember(member.id);
                else setSelectedInviteRemoveMember(member.id);
              }}
            >
              <span className="flex items-center justify-start gap-2">
                <X className="h-4 w-4" />

                <span> {member.memberId !== user?.id ? "Remove member" : "Leave project"}</span>
              </span>
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
    </>
  );
});
