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

import { useMemo } from "react";
// plane ui
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/propel/toast";
// hooks
import { useProject } from "@/hooks/store/use-project";
// types
import { useProjectAttachments } from "@/plane-web/hooks/store/projects/use-project-attachments";
import type { TAttachmentUploadStatus } from "@/store/project/project-details/attachment.store";

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
          setLastCollapsibleAction("attachments");
        } catch (error) {
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
        } catch (_error) {
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
