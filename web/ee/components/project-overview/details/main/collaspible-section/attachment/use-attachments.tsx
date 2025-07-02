"use client";
import { useMemo } from "react";
// plane ui
import { PROJECT_OVERVIEW_TRACKER_EVENTS } from "@plane/constants";
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
// hooks
import { captureSuccess, captureError } from "@/helpers/event-tracker.helper";
import { useProject } from "@/hooks/store";
// types
import { useProjectAttachments } from "@/plane-web/hooks/store/projects/use-project-attachments";
import { TAttachmentUploadStatus } from "@/plane-web/store/projects/project-details/attachment.store";

export type TAttachmentOperations = {
  create: (file: File) => Promise<void>;
  remove: (attachmentId: string) => Promise<void>;
};

export type TAttachmentSnapshot = {
  uploadStatus: TAttachmentUploadStatus[] | undefined;
};

export type TAttachmentHelpers = {
  operations: TAttachmentOperations;
  snapshot: TAttachmentSnapshot;
};

export const useAttachmentOperations = (workspaceSlug: string, projectId: string): TAttachmentHelpers => {
  const { createAttachment, removeAttachment, getAttachmentsUploadStatusByProjectId } = useProjectAttachments();
  const { setLastCollapsibleAction } = useProject();

  const attachmentOperations: TAttachmentOperations = useMemo(
    () => ({
      create: async (file) => {
        try {
          if (!workspaceSlug || !projectId) throw new Error("Missing required fields");
          const attachmentUploadPromise = createAttachment(workspaceSlug, projectId, file);
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

          await attachmentUploadPromise;
          captureSuccess({
            eventName: PROJECT_OVERVIEW_TRACKER_EVENTS.attachment_added,
            payload: { id: projectId },
          });

          setLastCollapsibleAction("attachments");
        } catch (error) {
          captureError({
            eventName: PROJECT_OVERVIEW_TRACKER_EVENTS.attachment_added,
            payload: { id: projectId },
          });
          throw error;
        }
      },
      remove: async (attachmentId) => {
        try {
          if (!workspaceSlug || !projectId) throw new Error("Missing required fields");
          await removeAttachment(workspaceSlug, projectId, attachmentId);
          setToast({
            message: "The attachment has been successfully removed",
            type: TOAST_TYPE.SUCCESS,
            title: "Attachment removed",
          });
          captureSuccess({
            eventName: PROJECT_OVERVIEW_TRACKER_EVENTS.attachment_removed,
            payload: { id: projectId, attachment_id: attachmentId },
          });
        } catch (error) {
          captureError({
            eventName: PROJECT_OVERVIEW_TRACKER_EVENTS.attachment_removed,
            payload: { id: projectId, attachment_id: attachmentId },
          });
          setToast({
            message: "The Attachment could not be removed",
            type: TOAST_TYPE.ERROR,
            title: "Attachment not removed",
          });
        }
      },
    }),
    [workspaceSlug, projectId, createAttachment, removeAttachment]
  );
  const attachmentsUploadStatus = getAttachmentsUploadStatusByProjectId(projectId);

  return {
    operations: attachmentOperations,
    snapshot: { uploadStatus: attachmentsUploadStatus },
  };
};
