"use client";
import { useMemo } from "react";
// plane ui
import { CUSTOMER_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useCustomers } from "@/plane-web/hooks/store";
// types
import { TAttachmentUploadStatus } from "@/store/issue/issue-details/attachment.store";

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
          captureSuccess({
            eventName: CUSTOMER_TRACKER_EVENTS.create_attachment,
            payload: {
              id: customerId,
              request_id: requestId,
            },
          });
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
          captureError({
            eventName: CUSTOMER_TRACKER_EVENTS.create_attachment,
            payload: {
              id: customerId,
              request_id: requestId,
            },
            error: error as Error,
          });
        }
      },
      remove: async (attachmentId) => {
        try {
          if (!workspaceSlug || !requestId) throw new Error("Missing required fields");
          await removeAttachment(workspaceSlug, customerId, attachmentId, requestId);
          captureSuccess({
            eventName: CUSTOMER_TRACKER_EVENTS.delete_attachment,
            payload: {
              id: customerId,
              request_id: requestId,
            },
          });
          setToast({
            message: t("customers.requests.toasts.attachment.remove.success.message"),
            type: TOAST_TYPE.SUCCESS,
            title: t("customers.requests.toasts.attachment.remove.success.title"),
          });
        } catch (error) {
          captureError({
            eventName: CUSTOMER_TRACKER_EVENTS.delete_attachment,
            payload: {
              id: customerId,
              request_id: requestId,
            },
            error: error as Error,
          });
          setToast({
            message: t("customers.requests.toasts.attachment.remove.error.message"),
            type: TOAST_TYPE.ERROR,
            title: t("customers.requests.toasts.attachment.remove.error.title"),
          });
        }
      },
    }),
    [workspaceSlug, requestId, createAttachment, removeAttachment]
  );
  const attachmentsUploadStatus = getAttachmentsUploadStatusByRequestId(requestId);

  return {
    operations: attachmentOperations,
    snapshot: { uploadStatus: attachmentsUploadStatus },
  };
};
