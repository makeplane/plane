import React, { useState } from "react";
// next
import { useRouter } from "next/router";
import type { NextPage } from "next";
// swr
import useSWR from "swr";
// headless ui
import { Menu } from "@headlessui/react";
// services
import projectService from "lib/services/project.service";
// hooks
import useUser from "lib/hooks/useUser";
// fetching keys
import { PROJECT_MEMBERS, PROJECT_INVITATIONS } from "constants/fetch-keys";
// layouts
import AdminLayout from "layouts/AdminLayout";
// components
import SendProjectInvitationModal from "components/project/SendProjectInvitationModal";
// ui
import { Spinner, Button } from "ui";
// icons
import { PlusIcon, EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import HeaderButton from "ui/HeaderButton";
import { BreadcrumbItem, Breadcrumbs } from "ui/Breadcrumbs";
import Image from "next/image";

const ROLE = {
  5: "Guest",
  10: "Viewer",
  15: "Member",
  20: "Admin",
};

const ProjectMembers: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { activeWorkspace, activeProject } = useUser();

  const router = useRouter();

  const { projectId } = router.query;

  const { data: projectMembers, mutate: mutateMembers } = useSWR(
    activeWorkspace && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    activeWorkspace && projectId
      ? () => projectService.projectMembers(activeWorkspace.slug, projectId as any)
      : null
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
    <AdminLayout>
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
                      {ROLE[member.role as keyof typeof ROLE] ?? "None"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 sm:pl-6">
                      {member?.member ? (
                        "Member"
                      ) : member.status ? (
                        <span className="p-0.5 px-2 text-sm bg-green-700 text-white rounded-full">
                          Accepted
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
                                onClick={() => {}}
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
                                onClick={async () => {
                                  member.member
                                    ? (await projectService.deleteProjectMember(
                                        activeWorkspace?.slug as string,
                                        projectId as any,
                                        member.id
                                      ),
                                      await mutateMembers())
                                    : (await projectService.deleteProjectInvitation(
                                        activeWorkspace?.slug as string,
                                        projectId as any,
                                        member.id
                                      ),
                                      await mutateInvitations());
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
    </AdminLayout>
  );
};

export default ProjectMembers;
