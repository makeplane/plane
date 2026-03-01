/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Table } from "@plane/ui";
// components
import { ConfirmProjectMemberRemove } from "@/components/projects/modals/confirm-project-member-remove";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// store
import type { IProjectMemberDetails } from "@/store/member/project/membership.store";
// local imports
import { useProjectMemberColumns } from "./useProjectMemberColumns";

type Props = {
  memberDetails: (IProjectMemberDetails | null)[];
  projectId: string;
  workspaceSlug: string;
};

export const ProjectMemberListItem = observer(function ProjectMemberListItem(props: Props) {
  const { memberDetails, projectId, workspaceSlug } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const { leaveProject } = useUserPermissions();
  const { data: currentUser } = useUser();
  const {
    project: { removeMemberFromProject },
  } = useMember();
  // helper hooks
  const { columns, removeMemberModal, setRemoveMemberModal } = useProjectMemberColumns({
    projectId,
    workspaceSlug,
  });

  const handleRemove = async (memberId: string) => {
    if (!workspaceSlug || !projectId || !memberId) return;

    if (memberId === currentUser?.id) {
      await leaveProject(workspaceSlug.toString(), projectId.toString())
        .then(async () => {
          router.push(`/${workspaceSlug}/projects`);
        })
        .catch((err) => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "You can’t leave this project yet.",
            message: err?.error || "Something went wrong. Please try again.",
          });
        });
    } else
      await removeMemberFromProject(workspaceSlug.toString(), projectId.toString(), memberId).catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "You can't remove the member from this project yet.",
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
        tHeadClassName="border-b border-subtle"
        thClassName="text-left font-medium divide-x-0 text-placeholder"
        tBodyClassName="divide-y-0"
        tBodyTrClassName="divide-x-0 p-4 h-[40px] text-secondary"
        tHeadTrClassName="divide-x-0"
      />
    </>
  );
});
