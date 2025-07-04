"use client";

import { useMemo } from "react";
import { EIssueServiceType, EIssuesStoreType, TIssue } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store";
import { useIssuesActions } from "@/hooks/use-issues-actions";

export type TEpicOperations = {
  fetch: (workspaceSlug: string, projectId: string, issueId: string, loader?: boolean) => Promise<void>;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
};

export const useEpicOperations = (): TEpicOperations => {
  const { fetchIssue } = useIssueDetail(EIssueServiceType.EPICS);
  const { updateIssue, removeIssue } = useIssuesActions(EIssuesStoreType.EPIC);

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
    }),
    [fetchIssue, updateIssue, removeIssue]
  );

  return epicOperations;
};
