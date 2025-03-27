import { FC, useCallback, useState } from "react";
import { observer } from "mobx-react";
import { FileRejection, useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// hooks
import { TOAST_TYPE, setToast } from "@plane/ui";
// plane web hooks
import { cn } from "@plane/utils";
import { useCustomers } from "@/plane-web/hooks/store";
import { useFileSize } from "@/plane-web/hooks/use-file-size";
// types
// components
import { RequestAttachmentsListItem } from "./attachment-item";
// types
import { RequestAttachmentDeleteModal } from "./delete-modal";
import { useAttachmentOperations } from "./helper";
import { RequestAttachmentsUploadItem } from "./upload-item";

type TIssueAttachmentItemList = {
  workspaceSlug: string;
  customerId: string;
  requestId: string;
  disabled?: boolean;
  isCollapsible?: boolean;
};

export const RequestAttachmentsList: FC<TIssueAttachmentItemList> = observer((props) => {
  const { workspaceSlug, requestId, customerId, disabled, isCollapsible } = props;
  const { t } = useTranslation();
  // states
  const [isUploading, setIsUploading] = useState(false);
  // store hooks
  const {
    attachment: { getAttachmentsByRequestId },
    attachmentDeleteModalId,
    toggleDeleteAttachmentModal,
  } = useCustomers();
  // helper
  const attachmentHelpers = useAttachmentOperations(workspaceSlug, customerId, requestId);

  const { operations: attachmentOperations, snapshot: attachmentSnapshot } = attachmentHelpers;
  const { create: createAttachment } = attachmentOperations;
  const { uploadStatus } = attachmentSnapshot;
  // file size
  const { maxFileSize } = useFileSize();
  // derived values
  const requestAttachments = requestId ? getAttachmentsByRequestId(requestId) : [];

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
    [createAttachment, maxFileSize, workspaceSlug]
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
        <RequestAttachmentsUploadItem key={uploadStatus.id} uploadStatus={uploadStatus} />
      ))}
      {requestAttachments && (
        <>
          {attachmentDeleteModalId && (
            <RequestAttachmentDeleteModal
              isOpen={Boolean(attachmentDeleteModalId)}
              onClose={() => toggleDeleteAttachmentModal(null)}
              attachmentOperations={attachmentOperations}
              attachmentId={attachmentDeleteModalId}
            />
          )}
          <div
            {...getRootProps()}
            className={`relative flex flex-col ${isDragActive && requestAttachments.length < 3 ? "min-h-[200px]" : ""} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            <input {...getInputProps()} />
            {isDragActive && (
              <div className="absolute flex items-center justify-center left-0 top-0 h-full w-full bg-custom-background-90/75 z-30 ">
                <div className="flex items-center justify-center p-1 rounded-md bg-custom-background-100">
                  <div className="flex flex-col justify-center items-center px-5 py-5 rounded-md border border-dashed border-custom-border-300">
                    <UploadCloud className="size-7" />
                    <span className="text-sm text-custom-text-300">{t("attachment.drag_and_drop")}</span>
                  </div>
                </div>
              </div>
            )}
            <div className={cn("w-full", !isCollapsible && "space-y-2 ")}>
              {requestAttachments?.map((attachmentId) => (
                <RequestAttachmentsListItem key={attachmentId} attachmentId={attachmentId} disabled={disabled} />
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
});
