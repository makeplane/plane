import { useState } from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
import { SettingsHeader } from "components/workspace";
// components
import ConfirmWorkspaceMemberRemove from "components/workspace/confirm-workspace-member-remove";
import SendWorkspaceInvitationModal from "components/workspace/send-workspace-invitation-modal";
// ui
import { CustomMenu, CustomSelect, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import type { NextPage } from "next";
// fetch-keys
import { WORKSPACE_DETAILS, WORKSPACE_INVITATIONS, WORKSPACE_MEMBERS } from "constants/fetch-keys";
// constants
import { ROLE } from "constants/workspace";

const MembersSettings: NextPage = () => {
  const [selectedRemoveMember, setSelectedRemoveMember] = useState<string | null>(null);
  const [selectedInviteRemoveMember, setSelectedInviteRemoveMember] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const { user } = useUser();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug.toString()) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug.toString()) : null)
  );

  const { data: workspaceMembers, mutate: mutateMembers } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS(workspaceSlug.toString()) : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug.toString()) : null
  );

  const { data: workspaceInvitations, mutate: mutateInvitations } = useSWR(
    workspaceSlug ? WORKSPACE_INVITATIONS : null,
    workspaceSlug ? () => workspaceService.workspaceInvitations(workspaceSlug.toString()) : null
  );

  const members = [
    ...(workspaceMembers?.map((item) => ({
      id: item.id,
      memberId: item.member?.id,
      avatar: item.member?.avatar,
      first_name: item.member?.first_name,
      last_name: item.member?.last_name,
      email: item.member?.email,
      role: item.role,
      status: true,
      member: true,
      accountCreated: true,
    })) || []),
    ...(workspaceInvitations?.map((item) => ({
      id: item.id,
      memberId: item.id,
      avatar: "",
      first_name: item.email,
      last_name: "",
      email: item.email,
      role: item.role,
      status: item.accepted,
      member: false,
      accountCreated: item?.accepted ? false : true,
    })) || []),
  ];

  const currentUser = workspaceMembers?.find((item) => item.member?.id === user?.id);

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${activeWorkspace?.name ?? "Workspace"}`}
            link={`/${workspaceSlug}`}
          />
          <BreadcrumbItem title="Members Settings" />
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
            await workspaceService.deleteWorkspaceMember(
              workspaceSlug as string,
              selectedRemoveMember
            );
            mutateMembers(
              (prevData) => prevData?.filter((item) => item.id !== selectedRemoveMember),
              false
            );
          }
          if (selectedInviteRemoveMember) {
            await workspaceService.deleteWorkspaceInvitations(
              workspaceSlug as string,
              selectedInviteRemoveMember
            );
            mutateInvitations(
              (prevData) => prevData?.filter((item) => item.id !== selectedInviteRemoveMember),
              false
            );
          }
          setToastAlert({
            type: "success",
            title: "Success",
            message: "Member removed successfully",
          });
          setSelectedRemoveMember(null);
          setSelectedInviteRemoveMember(null);
        }}
      />
      <SendWorkspaceInvitationModal
        isOpen={inviteModal}
        setIsOpen={setInviteModal}
        workspace_slug={workspaceSlug as string}
        members={members}
        user={user}
      />
      <div className="p-8">
        <SettingsHeader />
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <h3 className="text-2xl font-semibold">Members</h3>
            <button
              type="button"
              className="flex items-center gap-2 text-custom-primary outline-none"
              onClick={() => setInviteModal(true)}
            >
              <PlusIcon className="h-4 w-4" />
              Add Member
            </button>
          </div>
          {!workspaceMembers || !workspaceInvitations ? (
            <Loader className="space-y-5">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          ) : (
            <div className="divide-y divide-custom-border-200 rounded-[10px] border border-custom-border-200 bg-custom-background-100 px-6">
              {members.length > 0
                ? members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-6">
                      <div className="flex items-center gap-x-8 gap-y-2">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700 p-4 capitalize text-white">
                          {member.avatar && member.avatar !== "" ? (
                            <img
                              src={member.avatar}
                              className="absolute top-0 left-0 h-full w-full object-cover rounded-lg"
                              alt={member.first_name}
                            />
                          ) : member.first_name !== "" ? (
                            member.first_name.charAt(0)
                          ) : (
                            member.email.charAt(0)
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm">
                            {member.first_name} {member.last_name}
                          </h4>
                          <p className="text-xs text-custom-text-200">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
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
                          label={ROLE[member.role as keyof typeof ROLE]}
                          value={member.role}
                          onChange={(value: any) => {
                            if (!workspaceSlug) return;

                            mutateMembers(
                              (prevData) =>
                                prevData?.map((m) =>
                                  m.id === member.id ? { ...m, role: value } : m
                                ),
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
                                  message:
                                    "An error occurred while updating member role. Please try again.",
                                });
                              });
                          }}
                          position="right"
                          disabled={
                            member.memberId === currentUser?.member.id ||
                            !member.status ||
                            (currentUser &&
                              currentUser.role !== 20 &&
                              currentUser.role < member.role)
                          }
                        >
                          {Object.keys(ROLE).map((key) => {
                            if (
                              currentUser &&
                              currentUser.role !== 20 &&
                              currentUser.role < parseInt(key)
                            )
                              return null;

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
                            Remove member
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
