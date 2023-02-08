import { useState } from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "services/project.service";
import workspaceService from "services/workspace.service";
// lib
import { requiredAdmin } from "lib/auth";
// hooks
import useToast from "hooks/use-toast";
// layouts
import AppLayout from "layouts/app-layout";
// components
import ConfirmProjectMemberRemove from "components/project/confirm-project-member-remove";
import SendProjectInvitationModal from "components/project/send-project-invitation-modal";
// ui
import { Button, CustomListbox, CustomMenu, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import type { NextPage, NextPageContext } from "next";
// fetch-keys
import {
  PROJECT_DETAILS,
  PROJECT_INVITATIONS,
  PROJECT_MEMBERS,
  WORKSPACE_DETAILS,
} from "constants/fetch-keys";
// constants
import { ROLE } from "constants/workspace";

type TMemberSettingsProps = {
  isMember: boolean;
  isOwner: boolean;
  isViewer: boolean;
  isGuest: boolean;
};

const MembersSettings: NextPage<TMemberSettingsProps> = (props) => {
  const { isMember, isOwner, isViewer, isGuest } = props;

  const [inviteModal, setInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedRemoveMember, setSelectedRemoveMember] = useState<string | null>(null);
  const [selectedInviteRemoveMember, setSelectedInviteRemoveMember] = useState<string | null>(null);

  const { setToastAlert } = useToast();

  const {
    query: { workspaceSlug, projectId },
  } = useRouter();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: projectMembers, mutate: mutateMembers } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null,
    {
      onErrorRetry(err, _, __, revalidate, revalidateOpts) {
        if (err?.status === 403) return;
        setTimeout(() => revalidate(revalidateOpts), 5000);
      },
    }
  );

  const { data: projectInvitations, mutate: mutateInvitations } = useSWR(
    workspaceSlug && projectId ? PROJECT_INVITATIONS : null,
    workspaceSlug && projectId
      ? () => projectService.projectInvitations(workspaceSlug as string, projectId as string)
      : null
  );

  const members = [
    ...(projectMembers?.map((item: any) => ({
      id: item.id,
      avatar: item.member?.avatar,
      first_name: item.member?.first_name,
      last_name: item.member?.last_name,
      email: item.member?.email,
      role: item.role,
      status: true,
      member: true,
    })) || []),
    ...(projectInvitations?.map((item: any) => ({
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
      <ConfirmProjectMemberRemove
        isOpen={Boolean(selectedRemoveMember) || Boolean(selectedInviteRemoveMember)}
        onClose={() => {
          setSelectedRemoveMember(null);
          setSelectedInviteRemoveMember(null);
        }}
        data={members.find(
          (item) => item.id === selectedRemoveMember || item.id === selectedInviteRemoveMember
        )}
        handleDelete={async () => {
          if (!activeWorkspace || !projectDetails) return;
          if (selectedRemoveMember) {
            await projectService.deleteProjectMember(
              activeWorkspace.slug,
              projectDetails.id,
              selectedRemoveMember
            );
            mutateMembers(
              (prevData) => prevData?.filter((item: any) => item.id !== selectedRemoveMember),
              false
            );
          }
          if (selectedInviteRemoveMember) {
            await projectService.deleteProjectInvitation(
              activeWorkspace.slug,
              projectDetails.id,
              selectedInviteRemoveMember
            );
            mutateInvitations(
              (prevData) => prevData?.filter((item: any) => item.id !== selectedInviteRemoveMember),
              false
            );
          }
          setToastAlert({
            type: "success",
            message: "Member removed successfully",
            title: "Success",
          });
        }}
      />
      <SendProjectInvitationModal
        isOpen={inviteModal}
        setIsOpen={setInviteModal}
        members={members}
      />
      <AppLayout
        settingsLayout="project"
        memberType={{ isMember, isOwner, isViewer, isGuest }}
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${projectDetails?.name ?? "Project"}`}
              link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
            />
            <BreadcrumbItem title="Members Settings" />
          </Breadcrumbs>
        }
      >
        <section className="space-y-8">
          <div>
            <h3 className="text-3xl font-bold leading-6 text-gray-900">Members</h3>
            <p className="mt-4 text-sm text-gray-500">Manage all the members of the project.</p>
          </div>
          {!projectMembers || !projectInvitations ? (
            <Loader className="space-y-5 md:w-2/3">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          ) : (
            <div className="md:w-2/3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-md mb-1 leading-6 text-gray-900">Manage members</h4>
                <Button
                  theme="secondary"
                  className="flex items-center gap-x-1"
                  onClick={() => setInviteModal(true)}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Member
                </Button>
              </div>
              <div className="mt-6 space-y-6">
                {members.length > 0
                  ? members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-x-8 gap-y-2">
                          <div className="relative flex h-10 w-10 items-center justify-center rounded bg-gray-700 p-4 capitalize text-white">
                            {member.avatar && member.avatar !== "" ? (
                              <Image
                                src={member.avatar}
                                alt={member.first_name}
                                layout="fill"
                                objectFit="cover"
                                className="rounded"
                              />
                            ) : member.first_name !== "" ? (
                              member.first_name.charAt(0)
                            ) : (
                              member.email.charAt(0)
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm">
                              {member.first_name} {member.last_name}{" "}
                            </h4>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        {!member.member && (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Request Pending
                          </span>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          {selectedMember === member.id ? (
                            <CustomListbox
                              options={Object.keys(ROLE).map((key) => ({
                                value: key,
                                display: ROLE[parseInt(key) as keyof typeof ROLE],
                              }))}
                              title={ROLE[member.role as keyof typeof ROLE] ?? "Select Role"}
                              value={member.role}
                              onChange={(value) => {
                                if (!activeWorkspace || !projectDetails) return;
                                projectService
                                  .updateProjectMember(
                                    activeWorkspace.slug,
                                    projectDetails.id,
                                    member.id,
                                    {
                                      role: value,
                                    }
                                  )
                                  .then((res) => {
                                    setToastAlert({
                                      type: "success",
                                      message: "Member role updated successfully.",
                                      title: "Success",
                                    });
                                    mutateMembers(
                                      (prevData: any) =>
                                        prevData.map((m: any) =>
                                          m.id === selectedMember
                                            ? { ...m, ...res, role: value }
                                            : m
                                        ),
                                      false
                                    );
                                    setSelectedMember(null);
                                  })
                                  .catch((err) => {
                                    console.log(err);
                                  });
                              }}
                            />
                          ) : (
                            <p>{ROLE[member.role as keyof typeof ROLE] ?? "None"}</p>
                          )}
                          <CustomMenu ellipsis>
                            <CustomMenu.MenuItem
                              onClick={() => {
                                if (!member.member) {
                                  setToastAlert({
                                    type: "error",
                                    message: "You can't edit a pending invitation.",
                                    title: "Error",
                                  });
                                } else {
                                  setSelectedMember(member.id);
                                }
                              }}
                            >
                              Edit
                            </CustomMenu.MenuItem>
                            <CustomMenu.MenuItem
                              onClick={() => {
                                if (member.member) {
                                  setSelectedRemoveMember(member.id);
                                } else {
                                  setSelectedInviteRemoveMember(member.id);
                                }
                              }}
                            >
                              Remove
                            </CustomMenu.MenuItem>
                          </CustomMenu>
                        </div>
                      </div>
                    ))
                  : null}
              </div>
            </div>
          )}
        </section>
      </AppLayout>
    </>
  );
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const projectId = ctx.query.projectId as string;
  const workspaceSlug = ctx.query.workspaceSlug as string;

  const memberDetail = await requiredAdmin(workspaceSlug, projectId, ctx.req?.headers.cookie);

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
