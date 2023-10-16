import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { WorkspaceService } from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
import useWorkspaceMembers from "hooks/use-workspace-members";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout-legacy";
// components
import ConfirmWorkspaceMemberRemove from "components/workspace/confirm-workspace-member-remove";
import SendWorkspaceInvitationModal from "components/workspace/send-workspace-invitation-modal";
import { SettingsSidebar } from "components/project";
// ui
import { Button, Loader } from "@plane/ui";
import { CustomMenu, CustomSelect, Icon } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { XMarkIcon } from "components/icons";
// types
import type { NextPage } from "next";
// fetch-keys
import { WORKSPACE_DETAILS, WORKSPACE_INVITATION_WITH_EMAIL, WORKSPACE_MEMBERS_WITH_EMAIL } from "constants/fetch-keys";
// constants
import { ROLE } from "constants/workspace";
// helper
import { truncateText } from "helpers/string.helper";

// services
const workspaceService = new WorkspaceService();

const MembersSettings: NextPage = () => {
  const [selectedRemoveMember, setSelectedRemoveMember] = useState<string | null>(null);
  const [selectedInviteRemoveMember, setSelectedInviteRemoveMember] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const { user } = useUser();

  const { isOwner } = useWorkspaceMembers(workspaceSlug?.toString(), Boolean(workspaceSlug));

  const { data: activeWorkspace } = useSWR(workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug.toString()) : null, () =>
    workspaceSlug ? workspaceService.getWorkspace(workspaceSlug.toString()) : null
  );

  const { data: workspaceMembers, mutate: mutateMembers } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS_WITH_EMAIL(workspaceSlug.toString()) : null,
    workspaceSlug ? () => workspaceService.workspaceMembersWithEmail(workspaceSlug.toString()) : null
  );

  const { data: workspaceInvitations, mutate: mutateInvitations } = useSWR(
    workspaceSlug ? WORKSPACE_INVITATION_WITH_EMAIL(workspaceSlug.toString()) : null,
    workspaceSlug ? () => workspaceService.workspaceInvitationsWithEmail(workspaceSlug.toString()) : null
  );

  const members = [
    ...(workspaceInvitations?.map((item) => ({
      id: item.id,
      memberId: item.id,
      avatar: "",
      first_name: item.email,
      last_name: "",
      email: item.email,
      display_name: item.email,
      role: item.role,
      status: item.accepted,
      member: false,
      accountCreated: item?.accepted ? false : true,
    })) || []),
    ...(workspaceMembers?.map((item) => ({
      id: item.id,
      memberId: item.member?.id,
      avatar: item.member?.avatar,
      first_name: item.member?.first_name,
      last_name: item.member?.last_name,
      email: item.member?.email,
      display_name: item.member?.display_name,
      role: item.role,
      status: true,
      member: true,
      accountCreated: true,
    })) || []),
  ];

  const currentUser = workspaceMembers?.find((item) => item.member?.id === user?.id);

  const handleInviteModalSuccess = () => {
    mutateInvitations();
  };

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(activeWorkspace?.name ?? "Workspace", 32)}`}
            link={`/${workspaceSlug}`}
            linkTruncate
          />
          <BreadcrumbItem title="Members Settings" unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <ConfirmWorkspaceMemberRemove
        isOpen={Boolean(selectedRemoveMember) || Boolean(selectedInviteRemoveMember)}
        onClose={() => {
          setSelectedRemoveMember(null);
          setSelectedInviteRemoveMember(null);
        }}
        data={
          selectedRemoveMember
            ? members.find((item) => item.id === selectedRemoveMember)
            : selectedInviteRemoveMember
            ? members.find((item) => item.id === selectedInviteRemoveMember)
            : null
        }
        handleDelete={async () => {
          if (!workspaceSlug) return;
          if (selectedRemoveMember) {
            workspaceService
              .deleteWorkspaceMember(workspaceSlug as string, selectedRemoveMember)
              .catch((err) => {
                const error = err?.error;
                setToastAlert({
                  type: "error",
                  title: "Error",
                  message: error || "Something went wrong",
                });
              })
              .finally(() => {
                mutateMembers((prevData: any) => prevData?.filter((item: any) => item.id !== selectedRemoveMember));
              });
          }
          if (selectedInviteRemoveMember) {
            mutateInvitations(
              (prevData: any) => prevData?.filter((item: any) => item.id !== selectedInviteRemoveMember),
              false
            );
            workspaceService
              .deleteWorkspaceInvitations(workspaceSlug as string, selectedInviteRemoveMember)
              .then(() => {
                setToastAlert({
                  type: "success",
                  title: "Success",
                  message: "Member removed successfully",
                });
              })
              .catch((err) => {
                const error = err?.error;
                setToastAlert({
                  type: "error",
                  title: "Error",
                  message: error || "Something went wrong",
                });
              })
              .finally(() => {
                mutateInvitations();
              });
          }
          setSelectedRemoveMember(null);
          setSelectedInviteRemoveMember(null);
        }}
      />
      <SendWorkspaceInvitationModal
        isOpen={inviteModal}
        setIsOpen={setInviteModal}
        workspace_slug={workspaceSlug as string}
        user={user}
        onSuccess={handleInviteModalSuccess}
      />
      <div className="flex flex-row gap-2 h-full">
        <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
          <SettingsSidebar />
        </div>
        <section className="pr-9 py-8 w-full overflow-y-auto">
          <div className="flex items-center justify-between gap-4 pt-2 pb-3.5 border-b border-custom-border-200">
            <h4 className="text-xl font-medium">Members</h4>
            <Button variant="primary" onClick={() => setInviteModal(true)}>
              Add Member
            </Button>
          </div>
          {!workspaceMembers || !workspaceInvitations ? (
            <Loader className="space-y-5">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          ) : (
            <div className="divide-y divide-custom-border-200">
              {members.length > 0
                ? members.map((member) => (
                    <div key={member.id} className="group flex items-center justify-between px-3.5 py-[18px]">
                      <div className="flex items-center gap-x-8 gap-y-2">
                        {member.avatar && member.avatar !== "" ? (
                          <Link href={`/${workspaceSlug}/profile/${member.memberId}`}>
                            <a className="relative flex h-10 w-10 items-center justify-center rounded-lg p-4 capitalize text-white">
                              <img
                                src={member.avatar}
                                className="absolute top-0 left-0 h-full w-full object-cover rounded-lg"
                                alt={member.display_name || member.email}
                              />
                            </a>
                          </Link>
                        ) : member.display_name || member.email ? (
                          <Link href={`/${workspaceSlug}/profile/${member.memberId}`}>
                            <a className="relative flex h-10 w-10 items-center justify-center rounded-lg p-4 capitalize bg-gray-700 text-white">
                              {(member.display_name || member.email)?.charAt(0)}
                            </a>
                          </Link>
                        ) : (
                          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg p-4 capitalize bg-gray-700 text-white">
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
                            <h4 className="text-sm cursor-default">{member.display_name || member.email}</h4>
                          )}
                          {isOwner && <p className="mt-0.5 text-xs text-custom-sidebar-text-300">{member.email}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {!member?.status && (
                          <div className="mr-2 flex items-center justify-center rounded-full bg-yellow-500/20 px-2 py-1 text-center text-xs text-yellow-500">
                            <p>Pending</p>
                          </div>
                        )}
                        {member?.status && !member?.accountCreated && (
                          <div className="mr-2 flex items-center justify-center rounded-full bg-blue-500/20 px-2 py-1 text-center text-xs text-blue-500">
                            <p>Account not created</p>
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
                              {member.memberId !== user?.id && (
                                <Icon iconName="expand_more" className="text-lg font-medium" />
                              )}
                            </div>
                          }
                          value={member.role}
                          onChange={(value: 5 | 10 | 15 | 20 | undefined) => {
                            if (!workspaceSlug) return;

                            mutateMembers(
                              (prevData: any) =>
                                prevData?.map((m: any) => (m.id === member.id ? { ...m, role: value } : m)),
                              false
                            );

                            workspaceService
                              .updateWorkspaceMember(workspaceSlug?.toString(), member.id, {
                                role: value,
                              })
                              .catch(() => {
                                setToastAlert({
                                  type: "error",
                                  title: "Error!",
                                  message: "An error occurred while updating member role. Please try again.",
                                });
                              });
                          }}
                          disabled={
                            member.memberId === currentUser?.member.id ||
                            !member.status ||
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
                        <CustomMenu ellipsis>
                          <CustomMenu.MenuItem
                            onClick={() => {
                              if (member.member) {
                                setSelectedRemoveMember(member.id);
                              } else {
                                setSelectedInviteRemoveMember(member.id);
                              }
                            }}
                          >
                            <span className="flex items-center justify-start gap-2">
                              <XMarkIcon className="h-4 w-4" />

                              <span> {user?.id === member.memberId ? "Leave" : "Remove member"}</span>
                            </span>
                          </CustomMenu.MenuItem>
                        </CustomMenu>
                      </div>
                    </div>
                  ))
                : null}
            </div>
          )}
        </section>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default MembersSettings;
