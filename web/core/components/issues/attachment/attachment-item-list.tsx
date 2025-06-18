import { FC, useCallback, useState } from "react";
import { observer } from "mobx-react";
import { FileRejection, useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EIssueServiceType, TIssueServiceType } from "@plane/types";
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
  issueServiceType?: TIssueServiceType;
};

export const IssueAttachmentItemList: FC<TIssueAttachmentItemList> = observer((props) => {
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
              issueServiceType={issueServiceType}
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
                    <span className="text-sm text-custom-text-300">{t("attachment.drag_and_drop")}</span>
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
