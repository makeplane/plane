// TODO: remove this page

import React, { useState } from "react";

import type { NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

import { Menu } from "@headlessui/react";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// services
import workspaceService from "lib/services/workspace.service";
// constants
import { ROLE } from "constants/";
import { WORKSPACE_DETAILS, WORKSPACE_INVITATIONS, WORKSPACE_MEMBERS } from "constants/fetch-keys";
// hoc
import withAuthWrapper from "lib/hoc/withAuthWrapper";
// layouts
import AppLayout from "layouts/app-layout";
// components
import SendWorkspaceInvitationModal from "components/workspace/send-workspace-invitation-modal";
import ConfirmWorkspaceMemberRemove from "components/workspace/confirm-workspace-member-remove";
// ui
import { Spinner, CustomListbox, BreadcrumbItem, Breadcrumbs, HeaderButton } from "ui";
// icons
import { PlusIcon, EllipsisHorizontalIcon } from "@heroicons/react/20/solid";

const WorkspaceInvite: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedRemoveMember, setSelectedRemoveMember] = useState<string | null>(null);
  const [selectedInviteRemoveMember, setSelectedInviteRemoveMember] = useState<string | null>(null);

  const {
    query: { workspaceSlug },
  } = useRouter();

  const { setToastAlert } = useToast();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const { data: workspaceMembers, mutate: mutateMembers } = useSWR<any[]>(
    activeWorkspace ? WORKSPACE_MEMBERS(activeWorkspace.slug) : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
  );

  const { data: workspaceInvitations, mutate: mutateInvitations } = useSWR<any[]>(
    activeWorkspace ? WORKSPACE_INVITATIONS : null,
    activeWorkspace ? () => workspaceService.workspaceInvitations(activeWorkspace.slug) : null
  );

  const members = [
    ...(workspaceMembers?.map((item) => ({
      id: item.id,
      avatar: item.member?.avatar,
      first_name: item.member?.first_name,
      email: item.member?.email,
      role: item.role,
      status: true,
      member: true,
    })) || []),
    ...(workspaceInvitations?.map((item) => ({
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
      meta={{
        title: "Plane - Workspace Invite",
      }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title={`${activeWorkspace?.name ?? "Workspace"} Members`} />
        </Breadcrumbs>
      }
      right={<HeaderButton Icon={PlusIcon} label="Add Member" onClick={() => setIsOpen(true)} />}
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
          if (!activeWorkspace) return;
          if (selectedRemoveMember) {
            await workspaceService.deleteWorkspaceMember(
              activeWorkspace.slug,
              selectedRemoveMember
            );
            mutateMembers(
              (prevData) => prevData?.filter((item) => item.id !== selectedRemoveMember),
              false
            );
          }
          if (selectedInviteRemoveMember) {
            await workspaceService.deleteWorkspaceInvitations(
              activeWorkspace.slug,
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
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        workspace_slug={activeWorkspace?.slug as string}
        members={members}
      />
      {!workspaceMembers || !workspaceInvitations ? (
        <div className="grid h-full w-full place-items-center px-4 sm:px-0">
          <Spinner />
        </div>
      ) : (
        <div className="w-full space-y-5">
          {members && members.length === 0 ? null : (
            <>
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
                              display: ROLE[parseInt(key) as keyof typeof ROLE],
                              value: key,
                            }))}
                            title={ROLE[member.role as keyof typeof ROLE] ?? "None"}
                            value={member.role}
                            onChange={(value) => {
                              workspaceService
                                .updateWorkspaceMember(activeWorkspace?.slug as string, member.id, {
                                  role: value,
                                })
                                .then(() => {
                                  mutateMembers(
                                    (prevData) =>
                                      prevData?.map((m) => {
                                        return m.id === selectedMember ? { ...m, role: value } : m;
                                      }),
                                    false
                                  );
                                  setToastAlert({
                                    title: "Success",
                                    type: "success",
                                    message: "Member role updated successfully.",
                                  });
                                  setSelectedMember(null);
                                })
                                .catch(() => {
                                  setToastAlert({
                                    title: "Error",
                                    type: "error",
                                    message: "An error occurred while updating member role.",
                                  });
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
                                    if (!member.status || !member.member) {
                                      setToastAlert({
                                        type: "error",
                                        title: "Error",
                                        message: "You can't edit this member.",
                                      });
                                      return;
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
            </>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default withAuthWrapper(WorkspaceInvite);
