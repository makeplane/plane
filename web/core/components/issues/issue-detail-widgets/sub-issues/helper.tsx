"use client";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { TIssue } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// helper
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useIssueDetail } from "@/hooks/store";
// type
import { TSubIssueOperations } from "../../sub-issues";

export type TRelationIssueOperations = {
  copyText: (text: string) => void;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
};

export const useSubIssueOperations = (): TSubIssueOperations => {
  const {
    subIssues: { setSubIssueHelpers },
    fetchSubIssues,
    createSubIssues,
    updateSubIssue,
    removeSubIssue,
    deleteSubIssue,
  } = useIssueDetail();
  const { captureIssueEvent } = useEventTracker();
  const pathname = usePathname();

  const subIssueOperations: TSubIssueOperations = useMemo(
    () => ({
      copyText: (text: string) => {
        const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
        copyTextToClipboard(`${originURL}/${text}`).then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Link Copied!",
            message: "Issue link copied to clipboard.",
          });
        });
      },
      fetchSubIssues: async (workspaceSlug: string, projectId: string, parentIssueId: string) => {
        try {
          await fetchSubIssues(workspaceSlug, projectId, parentIssueId);
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Error fetching sub-issues",
          });
        }
      },
      addSubIssue: async (workspaceSlug: string, projectId: string, parentIssueId: string, issueIds: string[]) => {
        try {
          await createSubIssues(workspaceSlug, projectId, parentIssueId, issueIds);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Sub-issues added successfully",
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Error adding sub-issue",
          });
        }
      },
      updateSubIssue: async (
        workspaceSlug: string,
        projectId: string,
        parentIssueId: string,
        issueId: string,
        issueData: Partial<TIssue>,
        oldIssue: Partial<TIssue> = {},
        fromModal: boolean = false
      ) => {
        try {
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
          await updateSubIssue(workspaceSlug, projectId, parentIssueId, issueId, issueData, oldIssue, fromModal);
          captureIssueEvent({
            eventName: "Sub-issue updated",
            payload: { ...oldIssue, ...issueData, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: Object.keys(issueData).join(","),
              change_details: Object.values(issueData).join(","),
            },
            path: pathname,
          });
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Sub-issue updated successfully",
          });
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
        } catch (error) {
          captureIssueEvent({
            eventName: "Sub-issue updated",
            payload: { ...oldIssue, ...issueData, state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: Object.keys(issueData).join(","),
              change_details: Object.values(issueData).join(","),
            },
            path: pathname,
          });
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Error updating sub-issue",
          });
        }
      },
      removeSubIssue: async (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) => {
        try {
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
          await removeSubIssue(workspaceSlug, projectId, parentIssueId, issueId);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Sub-issue removed successfully",
          });
          captureIssueEvent({
            eventName: "Sub-issue removed",
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "parent_id",
              change_details: parentIssueId,
            },
            path: pathname,
          });
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
        } catch (error) {
          captureIssueEvent({
            eventName: "Sub-issue removed",
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "parent_id",
              change_details: parentIssueId,
            },
            path: pathname,
          });
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Error removing sub-issue",
          });
        }
      },
      deleteSubIssue: async (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) => {
        try {
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
          return deleteSubIssue(workspaceSlug, projectId, parentIssueId, issueId).then(() => {
            captureIssueEvent({
              eventName: "Sub-issue deleted",
              payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
              path: pathname,
            });
            setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
          });
        } catch (error) {
          captureIssueEvent({
            eventName: "Sub-issue removed",
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            path: pathname,
          });
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Error deleting issue",
          });
        }
      },
    }),
    [fetchSubIssues, createSubIssues, updateSubIssue, removeSubIssue, deleteSubIssue, setSubIssueHelpers]
  );

  return subIssueOperations;
};
