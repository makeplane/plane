"use client";
import { useMemo } from "react";
import { WORK_ITEM_TRACKER_EVENTS } from "@plane/constants";
import { setPromiseToast, TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { MediaLibraryService } from "@/services/media-library.service";
// types
import type { TAttachmentUploadStatus } from "@/store/issue/issue-details/attachment.store";
import { buildArtifactName, resolveAttachmentFileName } from "../media-library-utils";

export type TAttachmentOperations = {
  create: (file: File) => Promise<void>;
  remove: (attachmentId: string, options?: { removeFromManifest?: boolean }) => Promise<void>;
};

export type TAttachmentSnapshot = {
  uploadStatus: TAttachmentUploadStatus[] | undefined;
};

export type TAttachmentHelpers = {
  operations: TAttachmentOperations;
  snapshot: TAttachmentSnapshot;
};

export const useAttachmentOperations = (
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  issueServiceType: TIssueServiceType = EIssueServiceType.ISSUES
): TAttachmentHelpers => {
  const {
    attachment: { createAttachment, removeAttachment, getAttachmentsUploadStatusByIssueId, getAttachmentById },
  } = useIssueDetail(issueServiceType);
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);

  const attachmentOperations: TAttachmentOperations = useMemo(
    () => ({
      create: async (file) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          const attachmentUploadPromise = createAttachment(workspaceSlug, projectId, issueId, file);
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
            eventName: WORK_ITEM_TRACKER_EVENTS.attachment.add,
            payload: { id: issueId },
          });
        } catch (error) {
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.attachment.add,
            payload: { id: issueId },
            error: error as Error,
          });
          throw error;
        }
      },
      remove: async (attachmentId, options) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          const removeFromManifest = options?.removeFromManifest ?? true;
          const attachment = getAttachmentById(attachmentId);
          const artifactName = attachment ? buildArtifactName(resolveAttachmentFileName(attachment), attachmentId) : "";
          await removeAttachment(workspaceSlug, projectId, issueId, attachmentId);
          setToast({
            message: "The attachment has been successfully removed",
            type: TOAST_TYPE.SUCCESS,
            title: "Attachment removed",
          });
          if (artifactName && removeFromManifest) {
            try {
              const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
              const packageId = typeof manifest?.id === "string" ? manifest.id : null;
              if (packageId) {
                await mediaLibraryService.deleteArtifact(workspaceSlug, projectId, packageId, artifactName);
              }
            } catch {
              // Ignore media library cleanup errors to avoid blocking attachment removal.
            }
          }
          captureSuccess({
            eventName: WORK_ITEM_TRACKER_EVENTS.attachment.remove,
            payload: { id: issueId },
          });
        } catch (error) {
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.attachment.remove,
            payload: { id: issueId },
            error: error as Error,
          });
          setToast({
            message: "The Attachment could not be removed",
            type: TOAST_TYPE.ERROR,
            title: "Attachment not removed",
          });
        }
      },
    }),
    [workspaceSlug, projectId, issueId, createAttachment, removeAttachment, getAttachmentById, mediaLibraryService]
  );
  const attachmentsUploadStatus = getAttachmentsUploadStatusByIssueId(issueId);

  return {
    operations: attachmentOperations,
    snapshot: { uploadStatus: attachmentsUploadStatus },
  };
};
