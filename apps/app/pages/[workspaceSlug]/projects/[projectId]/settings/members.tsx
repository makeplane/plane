import { useState } from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "services/project.service";
import workspaceService from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
import useProjectDetails from "hooks/use-project-details";
import useUser from "hooks/use-user";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// components
import ConfirmProjectMemberRemove from "components/project/confirm-project-member-remove";
import SendProjectInvitationModal from "components/project/send-project-invitation-modal";
import { SettingsHeader } from "components/project";
// ui
import { CustomMenu, CustomSelect, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
// types
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_INVITATIONS, PROJECT_MEMBERS, WORKSPACE_DETAILS } from "constants/fetch-keys";
// constants
import { ROLE } from "constants/workspace";

const MembersSettings: NextPage = () => {
  const [inviteModal, setInviteModal] = useState(false);
  const [selectedRemoveMember, setSelectedRemoveMember] = useState<string | null>(null);
  const [selectedInviteRemoveMember, setSelectedInviteRemoveMember] = useState<string | null>(null);

  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUser();
  const { projectDetails } = useProjectDetails();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const { data: projectMembers, mutate: mutateMembers } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: projectInvitations, mutate: mutateInvitations } = useSWR(
    workspaceSlug && projectId ? PROJECT_INVITATIONS : null,
    workspaceSlug && projectId
      ? () => projectService.projectInvitations(workspaceSlug as string, projectId as string)
      : null
  );

  const members = [
    ...(projectMembers?.map((item) => ({
      id: item.id,
      memberId: item.member?.id,
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
      memberId: item.id,
      avatar: item.avatar ?? "",
      first_name: item.first_name ?? item.email,
      last_name: item.last_name ?? "",
      email: item.email,
      role: item.role,
      status: item.accepted,
      member: false,
    })) || []),
  ];

  const currentUser = projectMembers?.find((item) => item.member.id === user?.id);

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
      <ProjectAuthorizationWrapper
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
        <div className="p-8">
          <SettingsHeader />
          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <h3 className="text-2xl font-semibold">Members</h3>
              <button
                type="button"
                className="flex items-center gap-2 text-brand-accent outline-none"
                onClick={() => setInviteModal(true)}
              >
                <PlusIcon className="h-4 w-4" />
                Add Member
              </button>
            </div>
            {!projectMembers || !projectInvitations ? (
              <Loader className="space-y-5">
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
              </Loader>
            ) : (
              <div className="divide-y divide-brand-base rounded-[10px] border border-brand-base bg-brand-base px-6">
                {members.length > 0
                  ? members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-6">
                        <div className="flex items-center gap-x-6 gap-y-2">
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
                            <p className="mt-0.5 text-xs text-brand-secondary">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {!member.member && (
                            <div className="mr-2 flex items-center justify-center rounded-full bg-yellow-500/20 px-2 py-1 text-center text-xs text-yellow-500">
                              Pending
                            </div>
                          )}
                          <CustomSelect
                            label={ROLE[member.role as keyof typeof ROLE]}
                            value={member.role}
                            onChange={(value: 5 | 10 | 15 | 20 | undefined) => {
                              if (!activeWorkspace || !projectDetails) return;

                              mutateMembers(
                                (prevData: any) =>
                                  prevData.map((m: any) =>
                                    m.id === member.id ? { ...m, role: value } : m
                                  ),
                                false
                              );

                              projectService
                                .updateProjectMember(
                                  activeWorkspace.slug,
                                  projectDetails.id,
                                  member.id,
                                  {
                                    role: value,
                                  }
                                )
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
                              member.memberId === user?.id ||
                              !member.member ||
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
                                if (member.member) setSelectedRemoveMember(member.id);
                                else setSelectedInviteRemoveMember(member.id);
                              }}
                            >
                              <span className="flex items-center justify-start gap-2">
                                <XMarkIcon className="h-4 w-4" />
                                <span>Remove member</span>
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
      </ProjectAuthorizationWrapper>
    </>
  );
};

export default MembersSettings;
