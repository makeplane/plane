"use client";
import { useMemo } from "react";
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
// type
import { TAttachmentOperations } from "@/components/issues/attachment";
// hooks
import { useEventTracker, useIssueDetail } from "@/hooks/store";

export const useAttachmentOperations = (
  workspaceSlug: string,
  projectId: string,
  issueId: string
): TAttachmentOperations => {
  const { createAttachment, removeAttachment } = useIssueDetail();
  const { captureIssueEvent } = useEventTracker();

  const handleAttachmentOperations: TAttachmentOperations = useMemo(
    () => ({
      create: async (data: FormData) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");

          const attachmentUploadPromise = createAttachment(workspaceSlug, projectId, issueId, data);
          setPromiseToast(attachmentUploadPromise, {
            loading: "Uploading attachment...",
            success: {
              title: "Attachment uploaded",
              message: () => "The attachment has been successfully uploaded",
            },
            error: {
              title: "Attachment not uploaded",
              message: () => "The attachment could not be uploaded",
            },
          });

          const res = await attachmentUploadPromise;
          captureIssueEvent({
            eventName: "Issue attachment added",
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "attachment",
              change_details: res.id,
            },
          });
        } catch (error) {
          captureIssueEvent({
            eventName: "Issue attachment added",
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
          });
        }
      },
      remove: async (attachmentId: string) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await removeAttachment(workspaceSlug, projectId, issueId, attachmentId);
          setToast({
            message: "The attachment has been successfully removed",
            type: TOAST_TYPE.SUCCESS,
            title: "Attachment removed",
          });
          captureIssueEvent({
            eventName: "Issue attachment deleted",
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "attachment",
              change_details: "",
            },
          });
        } catch (error) {
          captureIssueEvent({
            eventName: "Issue attachment deleted",
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "attachment",
              change_details: "",
            },
          });
          setToast({
            message: "The Attachment could not be removed",
            type: TOAST_TYPE.ERROR,
            title: "Attachment not removed",
          });
        }
      },
    }),
    [workspaceSlug, projectId, issueId, createAttachment, removeAttachment]
  );

  return handleAttachmentOperations;
};
