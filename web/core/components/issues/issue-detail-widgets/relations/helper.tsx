"use client";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { TIssue } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// constants
import { ISSUE_DELETED, ISSUE_UPDATED } from "@/constants/event-tracker";
// helper
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useIssueDetail } from "@/hooks/store";

export type TRelationIssueOperations = {
  copyText: (text: string) => void;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
};

export const useRelationOperations = (): TRelationIssueOperations => {
  const { updateIssue, removeIssue } = useIssueDetail();
  const { captureIssueEvent } = useEventTracker();
  const pathname = usePathname();

  const issueOperations: TRelationIssueOperations = useMemo(
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
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          await updateIssue(workspaceSlug, projectId, issueId, data);
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...data, issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: pathname,
          });
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Issue updated successfully",
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: pathname,
          });
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Issue update failed",
          });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          return removeIssue(workspaceSlug, projectId, issueId).then(() => {
            captureIssueEvent({
              eventName: ISSUE_DELETED,
              payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
              path: pathname,
            });
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            path: pathname,
          });
        }
      },
    }),
    [pathname, removeIssue, updateIssue]
  );

  return issueOperations;
};
