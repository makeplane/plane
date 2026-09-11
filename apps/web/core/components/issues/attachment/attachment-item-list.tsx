/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import { UploadOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web hooks
import { useFileSize } from "@/hooks/use-file-size";
// types
import type { TAttachmentHelpers } from "../issue-detail-widgets/attachments/helper";
import { useAttachmentDropHandler } from "../issue-detail-widgets/attachments/helper";
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
  // store hooks
  const {
    attachment: { getAttachmentsByIssueId },
    attachmentDeleteModalId,
    toggleDeleteAttachmentModal,
    fetchActivities,
  } = useIssueDetail(issueServiceType);
  const { operations: attachmentOperations, snapshot: attachmentSnapshot } = attachmentHelpers;
  const { create: createAttachment } = attachmentOperations;
  const { uploadStatus } = attachmentSnapshot;
  // file size
  const { maxFileSize } = useFileSize();
  // derived values
  const issueAttachments = getAttachmentsByIssueId(issueId);

  // handlers
  const handleUploadSettled = useCallback(() => {
    fetchActivities(workspaceSlug, projectId, issueId);
  }, [fetchActivities, workspaceSlug, projectId, issueId]);

  const { onDrop, isUploading } = useAttachmentDropHandler({
    create: createAttachment,
    maxFileSize,
    onUploadSettled: handleUploadSettled,
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    multiple: true,
    disabled: isUploading || disabled || !workspaceSlug,
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
                    <UploadOutline className="size-7" />
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
              />
            ))}
          </div>
        </>
      )}
    </>
  );
});
