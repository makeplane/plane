"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
// plane imports
import { WORK_ITEM_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssueServiceType, TIssueServiceType, TSubIssueOperations } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
import { copyUrlToClipboard } from "@plane/utils";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useIssueDetail, useProjectState } from "@/hooks/store";
// plane web helpers
import { updateEpicAnalytics } from "@/plane-web/helpers/epic-analytics";

export const useSubIssueOperations = (issueServiceType: TIssueServiceType): TSubIssueOperations => {
  // router
  const { epicId: epicIdParam } = useParams();
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
          captureSuccess({
            eventName: WORK_ITEM_TRACKER_EVENTS.sub_issue.update,
            payload: { id: issueId, parent_id: parentIssueId },
          });
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("toast.success"),
            message: t("sub_work_item.update.success"),
          });
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
        } catch (error) {
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.sub_issue.update,
            payload: { id: issueId, parent_id: parentIssueId },
            error: error as Error,
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
          captureSuccess({
            eventName: WORK_ITEM_TRACKER_EVENTS.sub_issue.remove,
            payload: { id: issueId, parent_id: parentIssueId },
          });
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
        } catch (error) {
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.sub_issue.remove,
            payload: { id: issueId, parent_id: parentIssueId },
            error: error as Error,
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
            captureSuccess({
              eventName: WORK_ITEM_TRACKER_EVENTS.sub_issue.delete,
              payload: { id: issueId, parent_id: parentIssueId },
            });
            setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
          });
        } catch (error) {
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.sub_issue.delete,
            payload: { id: issueId, parent_id: parentIssueId },
            error: error as Error,
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
      createSubIssues,
      deleteSubIssue,
      epicId,
      fetchSubIssues,
      getIssueById,
      getStateById,
      issueServiceType,
      removeSubIssue,
      setSubIssueHelpers,
      t,
      updateAnalytics,
      updateSubIssue,
    ]
  );

  return subIssueOperations;
};
