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

import { useMemo } from "react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue } from "@plane/types";
import { EIssueServiceType, EIssuesStoreType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useIssues } from "@/hooks/store/use-issues";

export type TEpicOperations = {
  fetch: (workspaceSlug: string, projectId: string, issueId: string, loader?: boolean) => Promise<void>;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  updateWorkItemMilestone: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    milestoneId: string | undefined
  ) => Promise<void>;
};

export const useEpicOperations = (): TEpicOperations => {
  const { fetchIssue, fetchActivities } = useIssueDetail(EIssueServiceType.EPICS);
  const { updateIssue, removeIssue } = useIssuesActions(EIssuesStoreType.EPIC);
  const {
    issues: { updateWorkItemMilestone },
  } = useIssues(EIssuesStoreType.EPIC);

  const epicOperations: TEpicOperations = useMemo(
    () => ({
      fetch: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await fetchIssue(workspaceSlug, projectId, issueId);
        } catch (error) {
          console.error("Error fetching the parent work item:", error);
        }
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          if (updateIssue) {
            await updateIssue(projectId, issueId, data);
          }
        } catch (error) {
          console.log("Error in updating work item:", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Epic update failed",
          });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          if (removeIssue) {
            await removeIssue(projectId, issueId);
            setToast({
              title: "Success!",
              type: TOAST_TYPE.SUCCESS,
              message: "Epic deleted successfully",
            });
          }
        } catch (error) {
          console.log("Error in deleting epic:", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Work item delete failed",
          });
        }
      },
      updateWorkItemMilestone: async (
        workspaceSlug: string,
        projectId: string,
        workItemId: string,
        milestoneId: string | undefined
      ) => {
        await updateWorkItemMilestone(workspaceSlug, projectId, workItemId, milestoneId);
        void fetchActivities(workspaceSlug, projectId, workItemId);
      },
    }),
    [fetchIssue, updateIssue, removeIssue, updateWorkItemMilestone, fetchActivities]
  );

  return epicOperations;
};
