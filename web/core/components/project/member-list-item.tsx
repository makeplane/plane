"use client";

import { observer } from "mobx-react";
// plane imports
import { PROJECT_MEMBER_LEAVE } from "@plane/constants";
import { TOAST_TYPE, Table, setToast } from "@plane/ui";
// components
import { ConfirmProjectMemberRemove } from "@/components/project";
// hooks
import { useEventTracker, useMember, useUser, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useProjectColumns } from "@/plane-web/components/projects/settings/useProjectColumns";
// store
import { IProjectMemberDetails } from "@/store/member/base-project-member.store";

type Props = {
  memberDetails: (IProjectMemberDetails | null)[];
  projectId: string;
  workspaceSlug: string;
};

export const ProjectMemberListItem: React.FC<Props> = observer((props) => {
  const { memberDetails, projectId, workspaceSlug } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const { leaveProject } = useUserPermissions();
  const { data: currentUser } = useUser();
  const {
    project: { removeMemberFromProject },
  } = useMember();
  const { captureEvent } = useEventTracker();
  // helper hooks
  const { columns, removeMemberModal, setRemoveMemberModal } = useProjectColumns({
    projectId,
    workspaceSlug,
  });

  const handleRemove = async (memberId: string) => {
    if (!workspaceSlug || !projectId || !memberId) return;

    if (memberId === currentUser?.id) {
      await leaveProject(workspaceSlug.toString(), projectId.toString())
        .then(async () => {
          router.push(`/${workspaceSlug}/projects`);
          captureEvent(PROJECT_MEMBER_LEAVE, {
            state: "SUCCESS",
            element: "Project settings members page",
          });
        })
        .catch((err) =>
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "You can’t leave this project yet.",
            message: err?.error || "Something went wrong. Please try again.",
          })
        );
    } else
      await removeMemberFromProject(workspaceSlug.toString(), projectId.toString(), memberId).catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "You can’t remove the member from this project yet.",
          message: err?.error || "Something went wrong. Please try again.",
        })
      );
  };

  if (!memberDetails) return null;
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
        thClassName="text-left font-medium divide-x-0 text-custom-text-400"
        tBodyClassName="divide-y-0"
        tBodyTrClassName="divide-x-0 p-4 h-[40px] text-custom-text-200"
        tHeadTrClassName="divide-x-0"
      />
    </>
  );
});
