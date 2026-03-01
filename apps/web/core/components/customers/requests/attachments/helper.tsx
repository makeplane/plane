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
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/propel/toast";
// hooks
import { useCustomers } from "@/plane-web/hooks/store";
// types
import type { TAttachmentUploadStatus } from "@/store/work-items/details/attachment.store";

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

export const useAttachmentOperations = (
  workspaceSlug: string,
  customerId: string,
  requestId: string
): TAttachmentHelpers => {
  const {
    attachment: { createAttachment, removeAttachment, getAttachmentsUploadStatusByRequestId },
  } = useCustomers();
  const { t } = useTranslation();

  const attachmentOperations: TAttachmentOperations = useMemo(
    () => ({
      create: async (file) => {
        try {
          if (!workspaceSlug) throw new Error("Missing required fields");
          const attachmentUploadPromise = createAttachment(workspaceSlug, customerId, file, requestId);
          setPromiseToast(attachmentUploadPromise, {
            loading: t("customers.requests.toasts.attachment.upload.loading"),
            success: {
              title: t("customers.requests.toasts.attachment.upload.success.title"),
              message: () => t("customers.requests.toasts.attachment.upload.success.message"),
            },
            error: {
              title: t("customers.requests.toasts.attachment.upload.error.title"),
              message: () => t("customers.requests.toasts.attachment.upload.error.message"),
            },
          });

          await attachmentUploadPromise;
        } catch (error) {
          console.error(error);
        }
      },
      remove: async (attachmentId) => {
        try {
          if (!workspaceSlug || !requestId) throw new Error("Missing required fields");
          await removeAttachment(workspaceSlug, customerId, attachmentId, requestId);
          setToast({
            message: t("customers.requests.toasts.attachment.remove.success.message"),
            type: TOAST_TYPE.SUCCESS,
            title: t("customers.requests.toasts.attachment.remove.success.title"),
          });
        } catch (error) {
          console.error(error);
          setToast({
            message: t("customers.requests.toasts.attachment.remove.error.message"),
            type: TOAST_TYPE.ERROR,
            title: t("customers.requests.toasts.attachment.remove.error.title"),
          });
        }
      },
    }),
    [workspaceSlug, customerId, requestId, createAttachment, removeAttachment]
  );
  const attachmentsUploadStatus = getAttachmentsUploadStatusByRequestId(requestId);

  return {
    operations: attachmentOperations,
    snapshot: { uploadStatus: attachmentsUploadStatus },
  };
};
