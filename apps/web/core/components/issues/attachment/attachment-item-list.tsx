/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import type { FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web hooks
import { useFileSize } from "@/plane-web/hooks/use-file-size";
// types
import type { TAttachmentHelpers } from "../issue-detail-widgets/attachments/helper";
// components
import { IssueAttachmentsListItem } from "./attachment-list-item";
import { IssueAttachmentsUploadItem } from "./attachment-list-upload-item";
import { IssueAttachmentPreviewDialog } from "./attachment-preview-dialog";
import { IssueAttachmentDeleteModal } from "./delete-attachment-modal";
// hooks
import { useIssueAttachmentPreview } from "./use-issue-attachment-preview";

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
    attachment: { getAttachmentsByIssueId, getAttachmentById },
    attachmentDeleteModalId,
    toggleDeleteAttachmentModal,
    fetchActivities,
  } = useIssueDetail(issueServiceType);
  const { operations: attachmentOperations, snapshot: attachmentSnapshot } = attachmentHelpers;
  const { create: createAttachment } = attachmentOperations;
  const { uploadStatus } = attachmentSnapshot;
  // file size
  const { maxFileSize } = useFileSize();
  // attachment preview
  const {
    isPreviewOpen,
    selectedItem,
    openAttachmentPreview,
    closeAttachmentPreview,
    goToNext,
    goToPrevious,
    hasNext,
    hasPrevious,
  } = useIssueAttachmentPreview({
    attachmentIds: getAttachmentsByIssueId(issueId),
    getAttachmentById,
  });
  // derived values
  const issueAttachments = getAttachmentsByIssueId(issueId);

  // handlers
  const handleFetchPropertyActivities = useCallback(() => {
    void fetchActivities(workspaceSlug, projectId, issueId);
  }, [fetchActivities, workspaceSlug, projectId, issueId]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const totalAttachedFiles = acceptedFiles.length + rejectedFiles.length;

      if (rejectedFiles.length === 0) {
        const currentFile: File = acceptedFiles[0];
        if (!currentFile || !workspaceSlug) return;

        setIsUploading(true);
        void createAttachment(currentFile)
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
      {uploadStatus?.map((uploadStatus) => (
        <IssueAttachmentsUploadItem key={uploadStatus.id} uploadStatus={uploadStatus} />
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
              <div className="absolute flex items-center justify-center left-0 top-0 h-full w-full bg-surface-2/75 z-30 ">
                <div className="flex items-center justify-center p-1 rounded-md bg-surface-1">
                  <div className="flex flex-col justify-center items-center px-5 py-6 rounded-md border border-dashed border-strong">
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
                onPreview={openAttachmentPreview}
              />
            ))}
          </div>
          <IssueAttachmentPreviewDialog
            isOpen={isPreviewOpen}
            onClose={closeAttachmentPreview}
            item={selectedItem}
            onNext={goToNext}
            onPrevious={goToPrevious}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
          />
        </>
      )}
    </>
  );
});
