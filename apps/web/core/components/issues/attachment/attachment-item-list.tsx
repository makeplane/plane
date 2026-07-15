/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import type { FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast, setPromiseToast } from "@plane/propel/toast";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web hooks
import { useFileSize } from "@/hooks/use-file-size";
// types
import type { TAttachmentHelpers } from "../issue-detail-widgets/attachments/helper";
// components
import { IssueAttachmentsListItem } from "./attachment-list-item";
import { IssueAttachmentsUploadItem } from "./attachment-list-upload-item";
// types
import { IssueAttachmentDeleteModal } from "./delete-attachment-modal";

type TIssueAttachmentItemList = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  attachmentHelpers: TAttachmentHelpers;
  disabled?: boolean;
  issueServiceType?: TIssueServiceType;
};

export const IssueAttachmentItemList = observer(function IssueAttachmentItemList(props: TIssueAttachmentItemList) {
  const {
    workspaceSlug,
    projectId,
    issueId,
    attachmentHelpers,
    disabled,
    issueServiceType = EIssueServiceType.ISSUES,
  } = props;
  const { t } = useTranslation();
  // states
  const [isUploading, setIsUploading] = useState(false);
  // store hooks
  const {
    attachment: { getAttachmentsByIssueId },
    attachmentDeleteModalId,
    toggleDeleteAttachmentModal,
    fetchActivities,
  } = useIssueDetail(issueServiceType);
  const { updateIssue, getIssueById } = useIssueDetail(issueServiceType).issue;
  const { operations: attachmentOperations, snapshot: attachmentSnapshot } = attachmentHelpers;
  const { create: createAttachment } = attachmentOperations;
  const { uploadStatus } = attachmentSnapshot;
  // file size
  const { maxFileSize } = useFileSize();
  // derived values
  const issueAttachments = getAttachmentsByIssueId(issueId);
  const coverImageAttachmentId = getIssueById(issueId)?.cover_image_attachment_id ?? null;

  // handlers
  const handleFetchPropertyActivities = useCallback(() => {
    fetchActivities(workspaceSlug, projectId, issueId);
  }, [fetchActivities, workspaceSlug, projectId, issueId]);

  const handleToggleCoverImage = useCallback(
    async (attachmentId: string) => {
      const isCurrentCover = getIssueById(issueId)?.cover_image_attachment_id === attachmentId;
      const nextCoverId = isCurrentCover ? null : attachmentId;
      const coverPromise = updateIssue(workspaceSlug, projectId, issueId, {
        cover_image_attachment_id: nextCoverId,
      }).then(() => {
        handleFetchPropertyActivities();
        return;
      });

      setPromiseToast(coverPromise, {
        loading: isCurrentCover ? t("attachment.remove_cover_loading") : t("attachment.set_cover_loading"),
        success: {
          title: isCurrentCover ? t("attachment.remove_cover_success_title") : t("attachment.set_cover_success_title"),
          message: () =>
            isCurrentCover ? t("attachment.remove_cover_success_message") : t("attachment.set_cover_success_message"),
        },
        error: {
          title: isCurrentCover ? t("attachment.remove_cover_error_title") : t("attachment.set_cover_error_title"),
          message: () =>
            isCurrentCover ? t("attachment.remove_cover_error_message") : t("attachment.set_cover_error_message"),
        },
      });

      return coverPromise;
    },
    [updateIssue, getIssueById, workspaceSlug, projectId, issueId, handleFetchPropertyActivities, t]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const totalAttachedFiles = acceptedFiles.length + rejectedFiles.length;

      if (rejectedFiles.length === 0) {
        const currentFile: File = acceptedFiles[0];
        if (!currentFile || !workspaceSlug) return;

        setIsUploading(true);
        createAttachment(currentFile)
          .catch(() => {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("toast.error"),
              message: t("attachment.error"),
            });
          })
          .finally(() => {
            handleFetchPropertyActivities();
            setIsUploading(false);
          });
        return;
      }

      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message:
          totalAttachedFiles > 1
            ? t("attachment.only_one_file_allowed")
            : t("attachment.file_size_limit", { size: maxFileSize / 1024 / 1024 }),
      });
      return;
    },
    [createAttachment, maxFileSize, workspaceSlug, handleFetchPropertyActivities, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    multiple: false,
    disabled: isUploading || disabled,
  });

  return (
    <>
      {uploadStatus?.map((status) => (
        <IssueAttachmentsUploadItem key={status.id} uploadStatus={status} />
      ))}
      {issueAttachments && (
        <>
          {attachmentDeleteModalId && (
            <IssueAttachmentDeleteModal
              isOpen={Boolean(attachmentDeleteModalId)}
              onClose={() => toggleDeleteAttachmentModal(null)}
              attachmentOperations={attachmentOperations}
              attachmentId={attachmentDeleteModalId}
              issueServiceType={issueServiceType}
            />
          )}
          <div
            {...getRootProps()}
            className={`relative flex flex-col ${isDragActive && issueAttachments.length < 3 ? "min-h-[200px]" : ""} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            <input {...getInputProps()} />
            {isDragActive && (
              <div className="absolute top-0 left-0 z-30 flex h-full w-full items-center justify-center bg-surface-2/75">
                <div className="flex items-center justify-center rounded-md bg-surface-1 p-1">
                  <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-strong px-5 py-6">
                    <UploadCloud className="size-7" />
                    <span className="text-13 text-tertiary">{t("attachment.drag_and_drop")}</span>
                  </div>
                </div>
              </div>
            )}
            {issueAttachments?.map((attachmentId) => (
              <IssueAttachmentsListItem
                key={attachmentId}
                attachmentId={attachmentId}
                disabled={disabled}
                issueServiceType={issueServiceType}
                onToggleCoverImage={handleToggleCoverImage}
                isCoverImage={coverImageAttachmentId === attachmentId}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
});
