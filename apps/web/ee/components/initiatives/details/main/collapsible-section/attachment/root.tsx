"use client";
import { FC, useCallback, useState } from "react";
import { observer } from "mobx-react";
import { FileRejection, useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// plane web hooks
import { useInitiativeAttachments } from "@/plane-web/hooks/store";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { useFileSize } from "@/plane-web/hooks/use-file-size";
// local components
import { InitiativeAttachmentsListItem } from "./attachment-list-item";
import { AttachmentsUploadItem } from "./attachment-list-upload-item";
import { InitiativeAttachmentDeleteModal } from "./delete-attachment-modal";
import { useAttachmentOperations } from "./use-attachments";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const InitiativeAttachmentRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  const [attachmentDeleteModalId, setAttachmentDeleteModalId] = useState<string | null>(null);
  // store hooks
  const attachmentHelpers = useAttachmentOperations(workspaceSlug, initiativeId);
  const { getAttachmentsByInitiativeId } = useInitiativeAttachments();

  // helpers
  const { operations: attachmentOperations, snapshot: attachmentSnapshot } = attachmentHelpers;

  // file size
  const { maxFileSize } = useFileSize();

  // derived values
  const initiativeAttachments = getAttachmentsByInitiativeId(initiativeId);
  const { uploadStatus } = attachmentSnapshot;

  // handlers
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const totalAttachedFiles = acceptedFiles.length + rejectedFiles.length;

      if (rejectedFiles.length === 0) {
        const currentFile: File = acceptedFiles[0];
        if (!currentFile || !workspaceSlug) return;

        setIsLoading(true);
        attachmentOperations
          .create(currentFile)
          .catch(() => {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "File could not be attached. Try uploading again.",
            });
          })
          .finally(() => {
            setIsLoading(false);
          });
        return;
      }

      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message:
          totalAttachedFiles > 1
            ? "Only one file can be uploaded at a time."
            : `File must be of ${maxFileSize / 1024 / 1024}MB or less in size.`,
      });
      return;
    },
    [attachmentOperations, maxFileSize, workspaceSlug]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    multiple: false,
    disabled: isLoading || disabled,
  });

  const toggleDeleteAttachmentModal = (attachmentId: string | null) => {
    setAttachmentDeleteModalId(attachmentId);
  };

  return (
    <>
      {uploadStatus?.map((uploadStatus) => <AttachmentsUploadItem key={uploadStatus.id} uploadStatus={uploadStatus} />)}
      {initiativeAttachments && (
        <>
          {attachmentDeleteModalId && (
            <InitiativeAttachmentDeleteModal
              isOpen={Boolean(attachmentDeleteModalId)}
              onClose={() => toggleDeleteAttachmentModal(null)}
              attachmentOperations={attachmentOperations}
              attachmentId={attachmentDeleteModalId}
            />
          )}
          <div
            {...getRootProps()}
            className={`relative flex flex-col ${isDragActive && initiativeAttachments.length < 3 ? "min-h-[200px]" : ""} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            <input {...getInputProps()} />
            {isDragActive && (
              <div className="absolute flex items-center justify-center left-0 top-0 h-full w-full bg-custom-background-90/75 z-30 ">
                <div className="flex items-center justify-center p-1 rounded-md bg-custom-background-100">
                  <div className="flex flex-col justify-center items-center px-5 py-6 rounded-md border border-dashed border-custom-border-300">
                    <UploadCloud className="size-7" />
                    <span className="text-sm text-custom-text-300">Drag and drop anywhere to upload</span>
                  </div>
                </div>
              </div>
            )}
            {initiativeAttachments?.map((attachmentId) => (
              <InitiativeAttachmentsListItem
                key={attachmentId}
                attachmentId={attachmentId}
                disabled={disabled}
                toggleDeleteAttachmentModal={toggleDeleteAttachmentModal}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
});
