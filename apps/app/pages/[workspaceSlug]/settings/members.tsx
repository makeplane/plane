import { useState } from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// lib
import { requiredWorkspaceAdmin } from "lib/auth";
// hooks
import useToast from "hooks/use-toast";
// services
import workspaceService from "services/workspace.service";
// layouts
import AppLayout from "layouts/app-layout";
// components
import ConfirmWorkspaceMemberRemove from "components/workspace/confirm-workspace-member-remove";
import SendWorkspaceInvitationModal from "components/workspace/send-workspace-invitation-modal";
// ui
import { CustomMenu, CustomSelect, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import type { GetServerSideProps, NextPage } from "next";
import { UserAuth } from "types";
// fetch-keys
import { WORKSPACE_DETAILS, WORKSPACE_INVITATIONS, WORKSPACE_MEMBERS } from "constants/fetch-keys";
// constants
import { ROLE } from "constants/workspace";

const MembersSettings: NextPage<UserAuth> = (props) => {
  const [selectedRemoveMember, setSelectedRemoveMember] = useState<string | null>(null);
  const [selectedInviteRemoveMember, setSelectedInviteRemoveMember] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const { data: workspaceMembers, mutate: mutateMembers } = useSWR<any[]>(
    workspaceSlug ? WORKSPACE_MEMBERS(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null
  );

  const { data: workspaceInvitations, mutate: mutateInvitations } = useSWR<any[]>(
    workspaceSlug ? WORKSPACE_INVITATIONS : null,
    workspaceSlug ? () => workspaceService.workspaceInvitations(workspaceSlug as string) : null
  );

  const members = [
    ...(workspaceMembers?.map((item) => ({
      id: item.id,
      avatar: item.member?.avatar,
      first_name: item.member?.first_name,
      last_name: item.member?.last_name,
      email: item.member?.email,
      role: item.role,
      status: true,
      member: true,
    })) || []),
    ...(workspaceInvitations?.map((item) => ({
      id: item.id,
      avatar: item.avatar ?? "",
      first_name: item.first_name ?? item.email,
      last_name: item.last_name ?? "",
      email: item.email,
      role: item.role,
      status: item.accepted,
      member: false,
    })) || []),
  ];

  return (
    <>
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
      />
      <AppLayout
        memberType={props}
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${activeWorkspace?.name ?? "Workspace"}`}
              link={`/${workspaceSlug}`}
            />
            <BreadcrumbItem title="Members Settings" />
          </Breadcrumbs>
        }
        settingsLayout
      >
        <section className="space-y-8">
          <div className="flex items-end justify-between gap-4">
            <h3 className="text-2xl font-semibold">Members</h3>
            <button
              type="button"
              className="flex items-center gap-2 text-theme outline-none"
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
            <div className="divide-y rounded-[10px] border border-gray-200 bg-white px-6">
              {members.length > 0
                ? members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-6">
                      <div className="flex items-center gap-x-8 gap-y-2">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700 p-4 capitalize text-white">
                          {member.avatar && member.avatar !== "" ? (
                            <Image
                              src={member.avatar}
                              alt={member.first_name}
                              layout="fill"
                              objectFit="cover"
                              className="rounded-lg"
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
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CustomSelect
                          label={ROLE[member.role as keyof typeof ROLE]}
                          value={member.role}
                          onChange={(value: any) => {
                            workspaceService
                              .updateWorkspaceMember(activeWorkspace?.slug as string, member.id, {
                                role: value,
                              })
                              .then(() => {
                                mutateMembers(
                                  (prevData) =>
                                    prevData?.map((m) =>
                                      m.id === member.id ? { ...m, role: value } : m
                                    ),
                                  false
                                );
                                setToastAlert({
                                  title: "Success",
                                  type: "success",
                                  message: "Member role updated successfully.",
                                });
                              })
                              .catch(() => {
                                setToastAlert({
                                  title: "Error",
                                  type: "error",
                                  message: "An error occurred while updating member role.",
                                });
                              });
                          }}
                        >
                          {Object.keys(ROLE).map((key) => (
                            <CustomSelect.Option key={key} value={key}>
                              <>{ROLE[parseInt(key) as keyof typeof ROLE]}</>
                            </CustomSelect.Option>
                          ))}
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
      </AppLayout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const workspaceSlug = ctx.params?.workspaceSlug as string;

  const memberDetail = await requiredWorkspaceAdmin(workspaceSlug, ctx.req.headers.cookie);

  if (memberDetail === null) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      isOwner: memberDetail?.role === 20,
      isMember: memberDetail?.role === 15,
      isViewer: memberDetail?.role === 10,
      isGuest: memberDetail?.role === 5,
    },
  };
};

export default MembersSettings;
