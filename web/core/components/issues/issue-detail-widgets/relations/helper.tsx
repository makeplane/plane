"use client";
import { useMemo } from "react";
// plane imports
import { WORK_ITEM_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssueServiceType, TIssue, TIssueServiceType } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
import { copyUrlToClipboard } from "@plane/utils";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useIssueDetail } from "@/hooks/store";

export type TRelationIssueOperations = {
  copyLink: (path: string) => void;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
};

export const useRelationOperations = (
  issueServiceType: TIssueServiceType = EIssueServiceType.ISSUES
): TRelationIssueOperations => {
  const { updateIssue, removeIssue } = useIssueDetail(issueServiceType);
  const { t } = useTranslation();
  // derived values
  const entityName = issueServiceType === EIssueServiceType.ISSUES ? "Work item" : "Epic";

  const issueOperations: TRelationIssueOperations = useMemo(
    () => ({
      copyLink: (path) => {
        copyUrlToClipboard(path).then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("common.link_copied"),
            message: t("entity.link_copied_to_clipboard", { entity: entityName }),
          });
        });
      },
      update: async (workspaceSlug, projectId, issueId, data) => {
        try {
          await updateIssue(workspaceSlug, projectId, issueId, data);
          captureSuccess({
            eventName: WORK_ITEM_TRACKER_EVENTS.update,
            payload: { id: issueId },
          });
          setToast({
            title: t("toast.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("entity.update.success", { entity: entityName }),
          });
        } catch (error) {
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.update,
            payload: { id: issueId },
            error: error as Error,
          });
          setToast({
            title: t("toast.error"),
            type: TOAST_TYPE.ERROR,
            message: t("entity.update.failed", { entity: entityName }),
          });
        }
      },
      remove: async (workspaceSlug, projectId, issueId) => {
        try {
          return removeIssue(workspaceSlug, projectId, issueId).then(() => {
            captureSuccess({
              eventName: WORK_ITEM_TRACKER_EVENTS.delete,
              payload: { id: issueId },
            });
          });
        } catch (error) {
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.delete,
            payload: { id: issueId },
            error: error as Error,
          });
        }
      },
    }),
    [entityName, removeIssue, t, updateIssue]
  );

  return issueOperations;
};
