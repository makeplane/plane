"use client";

import { useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
// plane imports
import { EIssueServiceType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssueServiceType, TSubIssueOperations } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
import { copyUrlToClipboard } from "@plane/utils";
// hooks
import { useEventTracker, useIssueDetail, useProjectState } from "@/hooks/store";
// plane web helpers
import { updateEpicAnalytics } from "@/plane-web/helpers/epic-analytics";

export const useSubIssueOperations = (issueServiceType: TIssueServiceType): TSubIssueOperations => {
  // router
  const { epicId: epicIdParam } = useParams();
  const pathname = usePathname();
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    issue: { getIssueById },
    subIssues: { setSubIssueHelpers },
    createSubIssues,
    fetchSubIssues,
    updateSubIssue,
    deleteSubIssue,
    removeSubIssue,
  } = useIssueDetail(issueServiceType);
  const { getStateById } = useProjectState();
  const { peekIssue: epicPeekIssue } = useIssueDetail(EIssueServiceType.EPICS);
  // const { updateEpicAnalytics } = useIssueTypes();
  const { updateAnalytics } = updateEpicAnalytics();
  const { captureIssueEvent } = useEventTracker();

  // derived values
  const epicId = epicIdParam || epicPeekIssue?.issueId;

  const subIssueOperations: TSubIssueOperations = useMemo(
    () => ({
      copyLink: (path) => {
        copyUrlToClipboard(path).then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("common.link_copied"),
            message: t("entity.link_copied_to_clipboard", {
              entity: t("epic.label", { count: 1 }),
            }),
          });
        });
      },
      fetchSubIssues: async (workspaceSlug, projectId, parentIssueId) => {
        try {
          await fetchSubIssues(workspaceSlug, projectId, parentIssueId);
        } catch {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("entity.fetch.failed", {
              entity:
                issueServiceType === EIssueServiceType.ISSUES
                  ? t("common.sub_work_items", { count: 2 })
                  : t("issue.label", { count: 2 }),
            }),
          });
        }
      },
      addSubIssue: async (workspaceSlug, projectId, parentIssueId, issueIds) => {
        try {
          await createSubIssues(workspaceSlug, projectId, parentIssueId, issueIds);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("toast.success"),
            message: t("entity.add.success", {
              entity:
                issueServiceType === EIssueServiceType.ISSUES
                  ? t("common.sub_work_items")
                  : t("issue.label", { count: 2 }),
            }),
          });
        } catch {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("entity.add.failed", {
              entity:
                issueServiceType === EIssueServiceType.ISSUES
                  ? t("common.sub_work_items")
                  : t("issue.label", { count: 2 }),
            }),
          });
        }
      },
      updateSubIssue: async (
        workspaceSlug,
        projectId,
        parentIssueId,
        issueId,
        issueData,
        oldIssue = {},
        fromModal = false
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
            title: t("toast.success"),
            message: t("sub_work_item.update.success"),
          });
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
        } catch {
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
            title: t("toast.error"),
            message: t("sub_work_item.update.error"),
          });
        }
      },
      removeSubIssue: async (workspaceSlug, projectId, parentIssueId, issueId) => {
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
            title: t("toast.success"),
            message: t("sub_work_item.remove.success"),
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
        } catch {
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
            title: t("toast.error"),
            message: t("sub_work_item.remove.error"),
          });
        }
      },
      deleteSubIssue: async (workspaceSlug, projectId, parentIssueId, issueId) => {
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
        } catch {
          captureIssueEvent({
            eventName: "Sub-issue removed",
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            path: pathname,
          });
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("issue.delete.error"),
          });
        }
      },
    }),
    [
      captureIssueEvent,
      createSubIssues,
      deleteSubIssue,
      epicId,
      fetchSubIssues,
      getIssueById,
      getStateById,
      issueServiceType,
      pathname,
      removeSubIssue,
      setSubIssueHelpers,
      t,
      updateAnalytics,
      updateSubIssue,
    ]
  );

  return subIssueOperations;
};
