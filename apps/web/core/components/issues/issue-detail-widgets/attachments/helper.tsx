/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo, useState } from "react";
import type { FileRejection } from "react-dropzone";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// types
import type { TAttachmentUploadStatus } from "@/store/issue/issue-details/attachment.store";

/**
 * Number of attachments uploaded in parallel. Dropping a folder of screenshots should not
 * open one request per file, but a strict sequence makes a large batch needlessly slow.
 */
const UPLOAD_CONCURRENCY = 3;

type TAttachmentUploadSummary = {
  uploadedCount: number;
  failedFileNames: string[];
};

export type TAttachmentUploadProgress = {
  completed: number;
  total: number;
};

export type TAttachmentOperations = {
  create: (files: File[], onProgress?: (progress: TAttachmentUploadProgress) => void) => Promise<void>;
  remove: (attachmentId: string) => Promise<void>;
};

export type TAttachmentSnapshot = {
  uploadStatus: TAttachmentUploadStatus[] | undefined;
};

export type TAttachmentHelpers = {
  operations: TAttachmentOperations;
  snapshot: TAttachmentSnapshot;
};

/**
 * Run `task` over every file, keeping at most `limit` uploads in flight. A rejected upload
 * is recorded and never aborts the batch, so one bad file cannot discard the rest.
 */
const uploadWithConcurrency = async (
  files: File[],
  limit: number,
  task: (file: File) => Promise<unknown>,
  onSettled: (file: File, isSuccess: boolean) => void
): Promise<void> => {
  let cursor = 0;
  const worker = async () => {
    while (cursor < files.length) {
      const file = files[cursor];
      cursor += 1;
      if (!file) continue;
      try {
        // Sequential by design: each worker drains the queue one file at a time so that
        // `limit` bounds the in-flight uploads. Promise.all here would be unbounded.
        // eslint-disable-next-line no-await-in-loop
        await task(file);
        onSettled(file, true);
      } catch {
        // The store logs the underlying error; the caller turns this into a user-facing message.
        onSettled(file, false);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, files.length) }, worker));
};

export const useAttachmentOperations = (
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  issueServiceType: TIssueServiceType = EIssueServiceType.ISSUES
): TAttachmentHelpers => {
  const { t } = useTranslation();
  const {
    attachment: { createAttachment, removeAttachment, getAttachmentsUploadStatusByIssueId },
  } = useIssueDetail(issueServiceType);

  const attachmentOperations: TAttachmentOperations = useMemo(
    () => ({
      create: async (files, onProgress) => {
        if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
        if (files.length === 0) return;

        const summary: TAttachmentUploadSummary = { uploadedCount: 0, failedFileNames: [] };
        let completed = 0;

        await uploadWithConcurrency(
          files,
          UPLOAD_CONCURRENCY,
          (file) => createAttachment(workspaceSlug, projectId, issueId, file),
          (file, isSuccess) => {
            if (isSuccess) summary.uploadedCount += 1;
            else summary.failedFileNames.push(file.name);
            completed += 1;
            onProgress?.({ completed, total: files.length });
          }
        );

        // A partially successful batch keeps the uploaded files and names only the ones that failed.
        if (summary.failedFileNames.length > 0) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("attachment.upload_failed_title", { count: summary.failedFileNames.length }),
            message:
              summary.uploadedCount > 0
                ? t("attachment.upload_partial_failure", {
                    count: summary.uploadedCount,
                    files: summary.failedFileNames.join(", "),
                  })
                : t("attachment.upload_failure", { files: summary.failedFileNames.join(", ") }),
          });
          return;
        }

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("attachment.upload_success_title", { count: summary.uploadedCount }),
          message: t("attachment.upload_success", { count: summary.uploadedCount }),
        });
      },
      remove: async (attachmentId) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await removeAttachment(workspaceSlug, projectId, issueId, attachmentId);
          setToast({
            message: "The attachment has been successfully removed",
            type: TOAST_TYPE.SUCCESS,
            title: "Attachment removed",
          });
        } catch (_error) {
          setToast({
            message: "The Attachment could not be removed",
            type: TOAST_TYPE.ERROR,
            title: "Attachment not removed",
          });
        }
      },
    }),
    [workspaceSlug, projectId, issueId, createAttachment, removeAttachment, t]
  );
  const attachmentsUploadStatus = getAttachmentsUploadStatusByIssueId(issueId);

  return {
    operations: attachmentOperations,
    snapshot: { uploadStatus: attachmentsUploadStatus },
  };
};

type TAttachmentDropHandlerArgs = {
  create: TAttachmentOperations["create"];
  maxFileSize: number;
  /** Runs once per drop, after the whole batch settles. */
  onUploadSettled?: () => void;
};

/**
 * Shared `onDrop` for every work item attachment dropzone. Files rejected by the dropzone
 * itself (over the size limit) are reported by name and the remaining ones still upload.
 */
export const useAttachmentDropHandler = (args: TAttachmentDropHandlerArgs) => {
  const { create, maxFileSize, onUploadSettled } = args;
  const { t } = useTranslation();
  // states
  const [progress, setProgress] = useState<TAttachmentUploadProgress | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("attachment.files_too_large", {
            count: rejectedFiles.length,
            size: maxFileSize / 1024 / 1024,
            files: rejectedFiles.map((rejection) => rejection.file.name).join(", "),
          }),
        });
      }

      if (acceptedFiles.length === 0) return;

      setProgress({ completed: 0, total: acceptedFiles.length });
      try {
        await create(acceptedFiles, setProgress);
      } catch (error) {
        // Per-file failures are already reported by `create`; this only catches a batch that
        // never started, such as a missing workspace or project id.
        console.error("Error in uploading issue attachments:", error);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("attachment.error"),
        });
      } finally {
        setProgress(null);
        onUploadSettled?.();
      }
    },
    [create, maxFileSize, onUploadSettled, t]
  );

  return {
    onDrop,
    progress,
    isUploading: progress !== null,
  };
};
