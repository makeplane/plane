"use client";

import { observer } from "mobx-react";

import { TOAST_TYPE, Table, setToast } from "@plane/ui";
// components
import { ConfirmProjectMemberRemove } from "@/components/project";
// constants
import { PROJECT_MEMBER_LEAVE } from "@/constants/event-tracker";

// hooks
import { useEventTracker, useMember, useProject, useUser, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useProjectColumns } from "@/plane-web/components/projects/settings/useProjectColumns";
import { IProjectMemberDetails } from "@/store/member/project-member.store";

type Props = {
  memberDetails: (IProjectMemberDetails | null)[];
};

export const ProjectMemberListItem: React.FC<Props> = observer((props) => {
  const { memberDetails } = props;
  const { columns, workspaceSlug, projectId, removeMemberModal, setRemoveMemberModal } = useProjectColumns();

  // router
  const router = useAppRouter();
  // store hooks
  const { leaveProject } = useUserPermissions();
  const { data: currentUser } = useUser();
  const { fetchProjects } = useProject();
  const {
    project: { removeMemberFromProject },
  } = useMember();
  const { captureEvent } = useEventTracker();
  // const { isMobile } = usePlatformOS();

  const handleRemove = async (memberId: string) => {
    if (!workspaceSlug || !projectId || !memberId) return;

    if (memberId === currentUser?.id) {
      router.push(`/${workspaceSlug}/projects`);
      await leaveProject(workspaceSlug.toString(), projectId.toString())
        .then(async () => {
          captureEvent(PROJECT_MEMBER_LEAVE, {
            state: "SUCCESS",
            element: "Project settings members page",
          });
          await fetchProjects(workspaceSlug.toString());
        })
        .catch((err) =>
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: err?.error || "Something went wrong. Please try again.",
          })
        );
    } else
      await removeMemberFromProject(workspaceSlug.toString(), projectId.toString(), memberId).catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error || "Something went wrong. Please try again.",
        })
      );
  };

  if (!memberDetails) return null;
  removeMemberModal && console.log("removeMemberModal", JSON.parse(JSON.stringify(removeMemberModal?.member)));
  return (
    <>
      {removeMemberModal && (
        <ConfirmProjectMemberRemove
          isOpen={removeMemberModal !== null}
          onClose={() => setRemoveMemberModal(null)}
          data={{ id: removeMemberModal.member.id, display_name: removeMemberModal.member.display_name || "" }}
          onSubmit={() => handleRemove(removeMemberModal.member.id)}
        />
      )}
      <Table
        columns={columns}
        data={(memberDetails?.filter((member): member is IProjectMemberDetails => member !== null) ?? []) as any}
        keyExtractor={(rowData) => rowData?.member.id ?? ""}
        tHeadClassName="border-b border-custom-border-100"
        thClassName="text-left font-medium divide-x-0"
        tBodyClassName="divide-y-0"
        tBodyTrClassName="divide-x-0"
        tHeadTrClassName="divide-x-0"
      />
    </>
  );
});
