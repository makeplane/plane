import React, { FC, useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import { Plus } from "lucide-react";
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
// components
import { TAttachmentOperations } from "@/components/issues/attachment";
// constants
import { MAX_FILE_SIZE } from "@/constants/common";
// helper
import { generateFileName } from "@/helpers/attachment.helper";
// hooks
import { useEventTracker, useInstance, useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
};

export const IssueAttachmentActionButton: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, customButton, disabled = false } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);

  // store hooks
  const { createAttachment, removeAttachment } = useIssueDetail();
  const { captureIssueEvent } = useEventTracker();
  const { config } = useInstance();

  // handler
  const handleAttachmentOperations: TAttachmentOperations = useMemo(
    () => ({
      create: async (data: FormData) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");

          const attachmentUploadPromise = createAttachment(workspaceSlug, projectId, issueId, data);
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

          const res = await attachmentUploadPromise;
          captureIssueEvent({
            eventName: "Issue attachment added",
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "attachment",
              change_details: res.id,
            },
          });
        } catch (error) {
          captureIssueEvent({
            eventName: "Issue attachment added",
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
          });
        }
      },
      remove: async (attachmentId: string) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await removeAttachment(workspaceSlug, projectId, issueId, attachmentId);
          setToast({
            message: "The attachment has been successfully removed",
            type: TOAST_TYPE.SUCCESS,
            title: "Attachment removed",
          });
          captureIssueEvent({
            eventName: "Issue attachment deleted",
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "attachment",
              change_details: "",
            },
          });
        } catch (error) {
          captureIssueEvent({
            eventName: "Issue attachment deleted",
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "attachment",
              change_details: "",
            },
          });
          setToast({
            message: "The Attachment could not be removed",
            type: TOAST_TYPE.ERROR,
            title: "Attachment not removed",
          });
        }
      },
    }),
    [captureIssueEvent, workspaceSlug, projectId, issueId, createAttachment, removeAttachment]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const currentFile: File = acceptedFiles[0];
      if (!currentFile || !workspaceSlug) return;

      const uploadedFile: File = new File([currentFile], generateFileName(currentFile.name), {
        type: currentFile.type,
      });
      const formData = new FormData();
      formData.append("asset", uploadedFile);
      formData.append(
        "attributes",
        JSON.stringify({
          name: uploadedFile.name,
          size: uploadedFile.size,
        })
      );
      setIsLoading(true);
      handleAttachmentOperations.create(formData).finally(() => setIsLoading(false));
    },
    [handleAttachmentOperations, workspaceSlug]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: config?.file_size_limit ?? MAX_FILE_SIZE,
    multiple: false,
    disabled: isLoading || disabled,
  });

  return (
    <>
      <button {...getRootProps()} type="button" disabled={disabled}>
        <input {...getInputProps()} />
        {customButton ? customButton : <Plus className="h-4 w-4" />}
      </button>
    </>
  );
});
