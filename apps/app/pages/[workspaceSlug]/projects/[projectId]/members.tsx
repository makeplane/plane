import React, { useState } from "react";

import Image from "next/image";
import { useRouter } from "next/router";
import type { NextPage, NextPageContext } from "next";

import useSWR from "swr";
// services
import projectService from "lib/services/project.service";
import workspaceService from "lib/services/workspace.service";
// hooks
import useToast from "lib/hooks/useToast";
// lib
import { requiredAuth } from "lib/auth";
// constants
import { ROLE } from "constants/";
// layouts
import AppLayout from "layouts/app-layout";
// components
import ConfirmProjectMemberRemove from "components/project/confirm-project-member-remove";
import SendProjectInvitationModal from "components/project/send-project-invitation-modal";
// headless ui
import { Menu } from "@headlessui/react";
// ui
import { Spinner, CustomListbox, BreadcrumbItem, Breadcrumbs, HeaderButton } from "ui";
// icons
import { PlusIcon, EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
// fetch-keys
import {
  PROJECT_MEMBERS,
  PROJECT_INVITATIONS,
  WORKSPACE_DETAILS,
  PROJECT_DETAILS,
} from "constants/fetch-keys";

const ProjectMembers: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);

  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const [selectedRemoveMember, setSelectedRemoveMember] = useState<string | null>(null);
  const [selectedInviteRemoveMember, setSelectedInviteRemoveMember] = useState<string | null>(null);

  const {
    query: { workspaceSlug, projectId },
  } = useRouter();

  const { setToastAlert } = useToast();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const { data: activeProject } = useSWR(
    activeWorkspace && projectId ? PROJECT_DETAILS(projectId as string) : null,
    activeWorkspace && projectId
      ? () => projectService.getProject(activeWorkspace.slug, projectId as string)
      : null
  );

  const { data: projectMembers, mutate: mutateMembers } = useSWR(
    activeWorkspace && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    activeWorkspace && projectId
      ? () => projectService.projectMembers(activeWorkspace.slug, projectId as any)
      : null,
    {
      onErrorRetry(err, _, __, revalidate, revalidateOpts) {
        if (err?.status === 403) return;
        setTimeout(() => revalidate(revalidateOpts), 5000);
      },
    }
  );

  const { data: projectInvitations, mutate: mutateInvitations } = useSWR(
    activeWorkspace && projectId ? PROJECT_INVITATIONS : null,
    activeWorkspace && projectId
      ? () => projectService.projectInvitations(activeWorkspace.slug, projectId as any)
      : null
  );

  let members = [
    ...(projectMembers?.map((item: any) => ({
      id: item.id,
      avatar: item.member?.avatar,
      first_name: item.member?.first_name,
      email: item.member?.email,
      role: item.role,
      status: true,
      member: true,
    })) || []),
    ...(projectInvitations?.map((item: any) => ({
      id: item.id,
      avatar: item.avatar ?? "",
      first_name: item.first_name ?? item.email,
      email: item.email,
      role: item.role,
      status: item.accepted,
      member: false,
    })) || []),
  ];

  return (
    <AppLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Members`} />
        </Breadcrumbs>
      }
      right={<HeaderButton Icon={PlusIcon} label="Add Member" onClick={() => setIsOpen(true)} />}
    >
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
          if (!activeWorkspace || !projectId) return;
          if (selectedRemoveMember) {
            await projectService.deleteProjectMember(
              activeWorkspace.slug,
              projectId as string,
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
              projectId as string,
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
      <SendProjectInvitationModal isOpen={isOpen} setIsOpen={setIsOpen} members={members} />
      {!projectMembers || !projectInvitations ? (
        <div className="grid h-full w-full place-items-center px-4 sm:px-0">
          <Spinner />
        </div>
      ) : (
        <div className="h-full w-full space-y-5">
          {members && members.length === 0 ? null : (
            <table className="min-w-full table-fixed divide-y divide-gray-300 border border-gray-300 md:rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    Status
                  </th>
                  <th scope="col" className="relative w-10 py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {members?.map((member: any) => (
                  <tr key={member.id}>
                    <td className="flex items-center gap-2 whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {member.avatar && member.avatar !== "" ? (
                        <Image
                          src={member.avatar}
                          height={20}
                          width={20}
                          className="rounded-full"
                          alt={member.first_name}
                        />
                      ) : (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-gray-700 capitalize text-white">
                          {member.first_name.charAt(0)}
                        </span>
                      )}
                      {member.email ?? "No email has been added."}
                    </td>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {selectedMember === member.id ? (
                        <CustomListbox
                          options={Object.keys(ROLE).map((key) => ({
                            value: key,
                            display: ROLE[parseInt(key) as keyof typeof ROLE],
                          }))}
                          title={ROLE[member.role as keyof typeof ROLE] ?? "Select Role"}
                          value={member.role}
                          onChange={(value) => {
                            if (!activeWorkspace || !projectId) return;
                            projectService
                              .updateProjectMember(
                                activeWorkspace.slug,
                                projectId as string,
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
                                    prevData.map((m: any) => {
                                      return m.id === selectedMember
                                        ? { ...m, ...res, role: value }
                                        : m;
                                    }),
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
                        ROLE[member.role as keyof typeof ROLE] ?? "None"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 sm:pl-6">
                      {member.member ? (
                        <span className="rounded-full bg-green-700 p-0.5 px-2 text-sm text-white">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-400 p-0.5 px-2 text-sm text-gray-900">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Menu>
                        <Menu.Button>
                          <EllipsisHorizontalIcon
                            width="16"
                            height="16"
                            className="inline text-gray-500"
                          />
                        </Menu.Button>
                        <Menu.Items className="absolute -left-20 top-9  z-50 w-28 cursor-pointer rounded border bg-white">
                          <Menu.Item>
                            <div className="border-b last:border-0 hover:bg-gray-100">
                              <button
                                className="w-full py-2 pl-2 text-left"
                                type="button"
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
                              </button>
                            </div>
                          </Menu.Item>
                          <Menu.Item>
                            <div className="border-b last:border-0 hover:bg-gray-100">
                              <button
                                className="w-full py-2 pl-2 text-left"
                                type="button"
                                onClick={() => {
                                  if (member.member) {
                                    setSelectedRemoveMember(member.id);
                                  } else {
                                    setSelectedInviteRemoveMember(member.id);
                                  }
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </Menu.Item>
                        </Menu.Items>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.req?.url;

  if (!user) {
    return {
      redirect: {
        destination: `/signin?next=${redirectAfterSignIn}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
};

export default ProjectMembers;
