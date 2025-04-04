"use client";
import { useMemo } from "react";
// plane ui
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
// hooks
import { useEventTracker, useProject } from "@/hooks/store";
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
  const { captureProjectEvent } = useEventTracker();

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

          const res = await attachmentUploadPromise;
          captureProjectEvent({
            eventName: "Project attachment added",
            payload: { id: projectId, state: "SUCCESS", element: "Project detail page" },
            updates: {
              changed_property: "attachment",
              change_details: res.id,
            },
          });

          setLastCollapsibleAction("attachments");
        } catch (error) {
          captureProjectEvent({
            eventName: "Project attachment added",
            payload: { id: projectId, state: "FAILED", element: "Project detail page" },
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
          captureProjectEvent({
            eventName: "Project attachment deleted",
            payload: { id: projectId, state: "SUCCESS", element: "Project detail page" },
            updates: {
              changed_property: "attachment",
              change_details: "",
            },
          });
        } catch (error) {
          captureProjectEvent({
            eventName: "Project attachment deleted",
            payload: { id: projectId, state: "FAILED", element: "Project detail page" },
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
    [captureProjectEvent, workspaceSlug, projectId, createAttachment, removeAttachment]
  );
  const attachmentsUploadStatus = getAttachmentsUploadStatusByProjectId(projectId);

  return {
    operations: attachmentOperations,
    snapshot: { uploadStatus: attachmentsUploadStatus },
  };
};
