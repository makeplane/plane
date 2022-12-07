import React, { useState } from "react";
// next
import Image from "next/image";
import type { NextPage } from "next";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// headless ui
import { Menu } from "@headlessui/react";
// services
import projectService from "lib/services/project.service";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// fetching keys
import { PROJECT_MEMBERS, PROJECT_INVITATIONS } from "constants/fetch-keys";
// layouts
import AppLayout from "layouts/AppLayout";
// components
import SendProjectInvitationModal from "components/project/SendProjectInvitationModal";
import ConfirmProjectMemberRemove from "components/project/ConfirmProjectMemberRemove";
// ui
import { Spinner, CustomListbox } from "ui";
// icons
import { PlusIcon, EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import HeaderButton from "ui/HeaderButton";
import { BreadcrumbItem, Breadcrumbs } from "ui/Breadcrumbs";

const ROLE = {
  5: "Guest",
  10: "Viewer",
  15: "Member",
  20: "Admin",
};

const ProjectMembers: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);

  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const [selectedRemoveMember, setSelectedRemoveMember] = useState<string | null>(null);
  const [selectedInviteRemoveMember, setSelectedInviteRemoveMember] = useState<string | null>(null);

  const { activeWorkspace, activeProject } = useUser();

  const { setToastAlert } = useToast();

  const router = useRouter();

  const { projectId } = router.query;

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
    <AppLayout>
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
              (prevData: any[]) =>
                prevData?.filter((item: any) => item.id !== selectedRemoveMember),
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
              (prevData: any[]) =>
                prevData?.filter((item: any) => item.id !== selectedInviteRemoveMember),
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
        <div className="h-full w-full grid place-items-center px-4 sm:px-0">
          <Spinner />
        </div>
      ) : (
        <div className="h-full w-full space-y-5">
          <Breadcrumbs>
            <BreadcrumbItem title="Projects" link="/projects" />
            <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Members`} />
          </Breadcrumbs>
          <div className="flex items-center justify-between cursor-pointer w-full">
            <h2 className="text-2xl font-medium">Invite Members</h2>
            <HeaderButton Icon={PlusIcon} label="Add Member" onClick={() => setIsOpen(true)} />
          </div>
          {members && members.length === 0 ? null : (
            <table className="min-w-full table-fixed border border-gray-300 md:rounded-lg divide-y divide-gray-300">
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
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 w-10">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {members?.map((member: any) => (
                  <tr key={member.id}>
                    <td className="whitespace-nowrap flex items-center gap-2 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {member.avatar && member.avatar !== "" ? (
                        <Image
                          src={member.avatar}
                          height={20}
                          width={20}
                          className="rounded-full"
                          alt={member.first_name}
                        />
                      ) : (
                        <span className="h-5 w-5 capitalize bg-gray-700 text-white grid place-items-center rounded-full">
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
                        <span className="p-0.5 px-2 text-sm bg-green-700 text-white rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="p-0.5 px-2 text-sm bg-yellow-400 text-black rounded-full">
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
                        <Menu.Items className="absolute z-50 w-28  bg-white rounded border cursor-pointer -left-20 top-9">
                          <Menu.Item>
                            <div className="hover:bg-gray-100 border-b last:border-0">
                              <button
                                className="w-full text-left py-2 pl-2"
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
                            <div className="hover:bg-gray-100 border-b last:border-0">
                              <button
                                className="w-full text-left py-2 pl-2"
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

export default ProjectMembers;
