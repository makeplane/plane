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

import { lazy, Suspense } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesActions } from "@/hooks/use-issues-actions";

// lazy imports
const DeleteIssueModal = lazy(() =>
  import("@/components/issues/delete-issue-modal").then((module) => ({ default: module.DeleteIssueModal }))
);

export type TWorkItemLevelModalsProps = {
  workspaceSlug: string;
  workItemIdentifier: string;
};

export const WorkItemLevelModals = observer(function WorkItemLevelModals(props: TWorkItemLevelModalsProps) {
  const { workspaceSlug, workItemIdentifier } = props;
  const router = useAppRouter();
  // store hooks
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();
  const { isDeleteIssueModalOpen, toggleDeleteIssueModal } = useCommandPalette();
  const { removeIssue: removeEpic } = useIssuesActions(EIssuesStoreType.EPIC);
  const { removeIssue: removeWorkItem } = useIssuesActions(EIssuesStoreType.PROJECT);
  // derived values
  const workItemId = getIssueIdByIdentifier(workItemIdentifier);
  const workItemDetails = workItemId ? getIssueById(workItemId) : undefined;
  const workItemProjectId = workItemDetails?.project_id;

  const handleDeleteIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const isEpic = workItemDetails?.is_epic;
      const deleteAction = isEpic ? removeEpic : removeWorkItem;
      const redirectPath = `/${workspaceSlug}/projects/${projectId}/${isEpic ? "epics" : "issues"}`;

      await deleteAction(projectId, issueId);
      router.push(redirectPath);
    } catch (error) {
      console.error("Failed to delete issue:", error);
    }
  };

  return (
    <Suspense>
      {workItemId && workItemDetails && workItemProjectId && (
        <DeleteIssueModal
          handleClose={() => toggleDeleteIssueModal(false)}
          isOpen={isDeleteIssueModalOpen}
          data={workItemDetails}
          onSubmit={() => handleDeleteIssue(workspaceSlug, workItemProjectId, workItemId)}
          isEpic={workItemDetails.is_epic}
        />
      )}
    </Suspense>
  );
});
