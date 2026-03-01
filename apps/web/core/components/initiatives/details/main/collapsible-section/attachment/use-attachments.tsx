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
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/propel/toast";
// hooks
import { useInitiativeAttachments } from "@/plane-web/hooks/store";
// types
import type { TAttachmentUploadStatus } from "@/store/initiatives/initiative-attachment.store";

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

export const useAttachmentOperations = (workspaceSlug: string, initiativeId: string): TAttachmentHelpers => {
  const { createAttachment, removeAttachment, getAttachmentsUploadStatusByInitiativeId } = useInitiativeAttachments();

  const attachmentOperations: TAttachmentOperations = useMemo(
    () => ({
      create: async (file) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing required fields");
          const attachmentUploadPromise = createAttachment(workspaceSlug, initiativeId, file);
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
        } catch (error) {
          console.log("error", error);
          throw error;
        }
      },
      remove: async (attachmentId) => {
        try {
          if (!workspaceSlug || !initiativeId) throw new Error("Missing required fields");
          await removeAttachment(workspaceSlug, initiativeId, attachmentId);
          setToast({
            message: "The attachment has been successfully removed",
            type: TOAST_TYPE.SUCCESS,
            title: "Attachment removed",
          });
        } catch (error) {
          setToast({
            message: "The Attachment could not be removed",
            type: TOAST_TYPE.ERROR,
            title: "Attachment not removed",
          });
        }
      },
    }),
    [workspaceSlug, initiativeId, createAttachment, removeAttachment]
  );
  const attachmentsUploadStatus = getAttachmentsUploadStatusByInitiativeId(initiativeId);

  return {
    operations: attachmentOperations,
    snapshot: { uploadStatus: attachmentsUploadStatus },
  };
};
