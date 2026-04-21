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

import { observer } from "mobx-react";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// types
import type { TAttachmentHelpers } from "../issue-detail-widgets/attachments/helper";
// components
import { IssueAttachmentsDetail } from "./attachment-detail";
import { IssueAttachmentPreviewDialog } from "./attachment-preview-dialog";
import { IssueAttachmentsUploadDetails } from "./attachment-upload-details";
// hooks
import { useIssueAttachmentPreview } from "./use-issue-attachment-preview";

type TIssueAttachmentsList = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  attachmentHelpers: TAttachmentHelpers;
  disabled?: boolean;
};

export const IssueAttachmentsList = observer(function IssueAttachmentsList(props: TIssueAttachmentsList) {
  const { issueId, attachmentHelpers, disabled } = props;
  // store hooks
  const {
    attachment: { getAttachmentsByIssueId, getAttachmentById },
  } = useIssueDetail();
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
  const { snapshot: attachmentSnapshot } = attachmentHelpers;
  const { uploadStatus } = attachmentSnapshot;
  const issueAttachments = getAttachmentsByIssueId(issueId);

  return (
    <>
      {uploadStatus?.map((uploadStatus) => (
        <IssueAttachmentsUploadDetails key={uploadStatus.id} uploadStatus={uploadStatus} />
      ))}
      {issueAttachments?.map((attachmentId) => (
        <IssueAttachmentsDetail
          key={attachmentId}
          attachmentId={attachmentId}
          disabled={disabled}
          attachmentHelpers={attachmentHelpers}
          onPreview={openAttachmentPreview}
        />
      ))}
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
  );
});
