"use client";
import { useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import { EIssueServiceType } from "@plane/constants";
import { TIssue, TIssueServiceType } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// helper
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useIssueDetail, useProjectState } from "@/hooks/store";
// plane-web
import { updateEpicAnalytics } from "@/plane-web/helpers/epic-analytics";
// type
import { TSubIssueOperations } from "../../sub-issues";

export type TRelationIssueOperations = {
  copyText: (text: string) => void;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
};

export const useSubIssueOperations = (
  issueServiceType: TIssueServiceType = EIssueServiceType.ISSUES
): TSubIssueOperations => {
  // router
  const { epicId: epicIdParam } = useParams();
  const pathname = usePathname();
  // store hooks
  const {
    issue: { getIssueById },
    subIssues: { setSubIssueHelpers },
    createSubIssues,
    updateSubIssue,
    deleteSubIssue,
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  const { peekIssue: epicPeekIssue } = useIssueDetail(EIssueServiceType.EPICS);
  // const { updateEpicAnalytics } = useIssueTypes();
  const { updateAnalytics } = updateEpicAnalytics();
  const { fetchSubIssues } = useIssueDetail();
  const { removeSubIssue } = useIssueDetail(issueServiceType);
  const { captureIssueEvent } = useEventTracker();

  // derived values
  const epicId = epicIdParam || epicPeekIssue?.issueId;

  const subIssueOperations: TSubIssueOperations = useMemo(
    () => ({
      copyText: (text: string) => {
        const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
        copyTextToClipboard(`${originURL}/${text}`).then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Link Copied!",
            message: `${issueServiceType === EIssueServiceType.ISSUES ? "Issue" : "Epic"} link copied to clipboard`,
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
            message: `Error fetching ${issueServiceType === EIssueServiceType.ISSUES ? "sub-issues" : "issues"}`,
          });
        }
      },
      addSubIssue: async (workspaceSlug: string, projectId: string, parentIssueId: string, issueIds: string[]) => {
        try {
          await createSubIssues(workspaceSlug, projectId, parentIssueId, issueIds);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `${issueServiceType === EIssueServiceType.ISSUES ? "Sub-issues" : "Issues"} added successfully`,
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: `Error adding ${issueServiceType === EIssueServiceType.ISSUES ? "sub-issues" : "issues"}`,
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

          if (issueServiceType === EIssueServiceType.EPICS) {
            const oldState = getStateById(oldIssue?.state_id)?.group;

            if (oldState && oldIssue && issueData && epicId) {
              // Check if parent_id is changed if yes then decrement the epic analytics count
              if (issueData.parent_id && oldIssue?.parent_id && issueData.parent_id !== oldIssue?.parent_id) {
                updateAnalytics(workspaceSlug, projectId, epicId.toString(), {
                  decrementStateGroupCount: `${oldState}_issues`,
                });
              }

              // Check if state_id is changed if yes then decrement the old state group count and increment the new state group count
              if (issueData.state_id) {
                const newState = getStateById(issueData.state_id)?.group;
                if (oldState && newState && oldState !== newState) {
                  updateAnalytics(workspaceSlug, projectId, epicId.toString(), {
                    decrementStateGroupCount: `${oldState}_issues`,
                    incrementStateGroupCount: `${newState}_issues`,
                  });
                }
              }
            }
          }
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
          if (issueServiceType === EIssueServiceType.EPICS) {
            const issueBeforeRemoval = getIssueById(issueId);
            const oldState = getStateById(issueBeforeRemoval?.state_id)?.group;

            if (epicId && oldState) {
              updateAnalytics(workspaceSlug, projectId, epicId.toString(), {
                decrementStateGroupCount: `${oldState}_issues`,
              });
            }
          }
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
