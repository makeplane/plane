import { FC, useCallback, useState } from "react";
import { observer } from "mobx-react";
import { FileRejection, useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
// hooks
import { TOAST_TYPE, setToast } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store";
// plane web hooks
import { useFileSize } from "@/plane-web/hooks/use-file-size";
// types
import { TAttachmentHelpers } from "../issue-detail-widgets/attachments/helper";
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
};

export const IssueAttachmentItemList: FC<TIssueAttachmentItemList> = observer((props) => {
  const { workspaceSlug, projectId, issueId, attachmentHelpers, disabled } = props;
  // states
  const [isUploading, setIsUploading] = useState(false);
  // store hooks
  const {
    attachment: { getAttachmentsByIssueId },
    attachmentDeleteModalId,
    toggleDeleteAttachmentModal,
    fetchActivities,
  } = useIssueDetail();
  const { operations: attachmentOperations, snapshot: attachmentSnapshot } = attachmentHelpers;
  const { create: createAttachment } = attachmentOperations;
  const { uploadStatus } = attachmentSnapshot;
  // file size
  const { maxFileSize } = useFileSize();
  // derived values
  const issueAttachments = getAttachmentsByIssueId(issueId);

  // handlers
  const handleFetchPropertyActivities = useCallback(() => {
    fetchActivities(workspaceSlug, projectId, issueId);
  }, [fetchActivities, workspaceSlug, projectId, issueId]);

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
              title: "Error!",
              message: "File could not be attached. Try uploading again.",
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
        title: "Error!",
        message:
          totalAttachedFiles > 1
            ? "Only one file can be uploaded at a time."
            : `File must be of ${maxFileSize / 1024 / 1024}MB or less in size.`,
      });
      return;
    },
    [createAttachment, maxFileSize, workspaceSlug, handleFetchPropertyActivities]
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
            />
          )}
          <div
            {...getRootProps()}
            className={`relative flex flex-col ${isDragActive && issueAttachments.length < 3 ? "min-h-[200px]" : ""} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
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
            {issueAttachments?.map((attachmentId) => (
              <IssueAttachmentsListItem key={attachmentId} attachmentId={attachmentId} disabled={disabled} />
            ))}
          </div>
        </>
      )}
    </>
  );
});
