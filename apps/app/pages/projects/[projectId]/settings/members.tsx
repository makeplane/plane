// react
import { useState } from "react";
// next
import Image from "next/image";
// swr
import useSWR from "swr";
// services
import projectService from "lib/services/project.service";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// layouts
import SettingsLayout from "layouts/settings-layout";
// components
import ConfirmProjectMemberRemove from "components/project/confirm-project-member-remove";
import SendProjectInvitationModal from "components/project/send-project-invitation-modal";
// ui
import { Button, CustomListbox, CustomMenu, Spinner } from "ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// fetch-keys
import { PROJECT_INVITATIONS, PROJECT_MEMBERS } from "constants/fetch-keys";

const ROLE = {
  5: "Guest",
  10: "Viewer",
  15: "Member",
  20: "Admin",
};

const MembersSettings = () => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedRemoveMember, setSelectedRemoveMember] = useState<string | null>(null);
  const [selectedInviteRemoveMember, setSelectedInviteRemoveMember] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState(false);

  const { activeWorkspace, activeProject } = useUser();

  const { setToastAlert } = useToast();

  const { data: projectMembers, mutate: mutateMembers } = useSWR(
    activeWorkspace && activeProject ? PROJECT_MEMBERS(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => projectService.projectMembers(activeWorkspace.slug, activeProject.id)
      : null,
    {
      onErrorRetry(err, _, __, revalidate, revalidateOpts) {
        if (err?.status === 403) return;
        setTimeout(() => revalidate(revalidateOpts), 5000);
      },
    }
  );

  const { data: projectInvitations, mutate: mutateInvitations } = useSWR(
    activeWorkspace && activeProject ? PROJECT_INVITATIONS : null,
    activeWorkspace && activeProject
      ? () => projectService.projectInvitations(activeWorkspace.slug, activeProject.id)
      : null
  );

  let members = [
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
          if (!activeWorkspace || !activeProject) return;
          if (selectedRemoveMember) {
            await projectService.deleteProjectMember(
              activeWorkspace.slug,
              activeProject.id,
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
              activeProject.id,
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
      <SettingsLayout type="project" noHeader>
        <section className="space-y-8">
          <div>
            <h3 className="text-3xl font-bold leading-6 text-gray-900">Members</h3>
            <p className="mt-4 text-sm text-gray-500">Manage all the members of the project.</p>
          </div>
          {!projectMembers || !projectInvitations ? (
            <div className="h-full w-full grid place-items-center px-4 sm:px-0">
              <Spinner />
            </div>
          ) : (
            <div className="md:w-2/3">
              <div className="flex justify-between items-center gap-2">
                <h4 className="text-md leading-6 text-gray-900 mb-1">Manage members</h4>
                <Button
                  theme="secondary"
                  className="flex items-center gap-x-1"
                  onClick={() => setInviteModal(true)}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Member
                </Button>
              </div>
              <div className="space-y-6 mt-6">
                {members.length > 0
                  ? members.map((member) => (
                      <div key={member.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-x-8 gap-y-2">
                          <div className="h-10 w-10 p-4 flex items-center justify-center bg-gray-700 text-white rounded capitalize relative">
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
                              {member.first_name} {member.last_name}
                            </h4>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
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
                                if (!activeWorkspace || !activeProject) return;
                                projectService
                                  .updateProjectMember(
                                    activeWorkspace.slug,
                                    activeProject.id,
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
      </SettingsLayout>
    </>
  );
};

export default MembersSettings;
