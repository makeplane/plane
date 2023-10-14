import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { useDropzone } from "react-dropzone";
// services
import { IssueAttachmentService } from "services/issue";
// fetch key
import { ISSUE_ATTACHMENTS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";
// icons
import { FileText, ChevronRight, X, Image as ImageIcon } from "lucide-react";
// components
import { Label, WebViewModal, DeleteConfirmation } from "components/web-view";
// helpers
import { getFileName } from "helpers/attachment.helper";
// types
import type { IIssueAttachment } from "types";

type Props = {
  allowed: boolean;
};

const isImage = (fileName: string) => /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(fileName);

const issueAttachmentService = new IssueAttachmentService();

export const IssueAttachments: React.FC<Props> = (props) => {
  const { allowed } = props;

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [deleteAttachment, setDeleteAttachment] = useState<IIssueAttachment | null>(null);
  const [attachmentDeleteModal, setAttachmentDeleteModal] = useState<boolean>(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles[0] || !workspaceSlug || !allowed) return;

      const formData = new FormData();
      formData.append("asset", acceptedFiles[0]);
      formData.append(
        "attributes",
        JSON.stringify({
          name: acceptedFiles[0].name,
          size: acceptedFiles[0].size,
        })
      );
      setIsLoading(true);

      issueAttachmentService
        .uploadIssueAttachment(workspaceSlug as string, projectId as string, issueId as string, formData)
        .then((res) => {
          mutate<IIssueAttachment[]>(
            ISSUE_ATTACHMENTS(issueId as string),
            (prevData) => [res, ...(prevData ?? [])],
            false
          );
          mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
          console.log(
            "toast",
            JSON.stringify({
              type: "success",
              title: "Success!",
              message: "File added successfully.",
            })
          );
          setIsOpen(false);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
          console.log(
            "toast",
            JSON.stringify({
              type: "error",
              title: "error!",
              message: "Something went wrong. please check file type & size (max 5 MB)",
            })
          );
        });
    },
    [issueId, projectId, workspaceSlug, allowed]
  );

  const handleDeletion = async (assetId: string) => {
    if (!workspaceSlug || !projectId) return;

    mutate<IIssueAttachment[]>(
      ISSUE_ATTACHMENTS(issueId as string),
      (prevData) => (prevData ?? [])?.filter((p) => p.id !== assetId),
      false
    );

    await issueAttachmentService
      .deleteIssueAttachment(workspaceSlug as string, projectId as string, issueId as string, assetId as string)
      .then(() => mutate(PROJECT_ISSUES_ACTIVITY(issueId as string)))
      .catch(() => {
        console.log(
          "toast",
          JSON.stringify({
            type: "error",
            message: "Something went wrong please try again.",
          })
        );
      });
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: 5 * 1024 * 1024,
    disabled: !allowed || isLoading,
  });

  const { data: attachments } = useSWR<IIssueAttachment[]>(
    workspaceSlug && projectId && issueId ? ISSUE_ATTACHMENTS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issueAttachmentService.getIssueAttachment(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      : null
  );

  return (
    <div>
      <DeleteConfirmation
        title="Delete Attachment"
        content={
          <p className="text-sm text-custom-text-200">
            Are you sure you want to delete attachment-{" "}
            <span className="font-bold">{getFileName(deleteAttachment?.attributes?.name ?? "")}</span>? This attachment
            will be permanently removed. This action cannot be undone.
          </p>
        }
        isOpen={allowed && attachmentDeleteModal}
        onCancel={() => setAttachmentDeleteModal(false)}
        onConfirm={() => {
          if (!deleteAttachment) return;
          handleDeletion(deleteAttachment.id);
          setAttachmentDeleteModal(false);
        }}
      />

      <WebViewModal isOpen={isOpen} onClose={() => setIsOpen(false)} modalTitle="Insert file">
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-b w-full py-2 text-custom-text-100 px-2 flex justify-between items-center ${
              !allowed || isLoading ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <input {...getInputProps()} />
            {isLoading ? (
              <p className="text-center">Uploading...</p>
            ) : (
              <>
                <h3 className="text-lg">Upload</h3>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </div>
        </div>
      </WebViewModal>

      <Label>Attachments</Label>
      <div className="mt-1 space-y-[6px]">
        {attachments?.map((attachment) => (
          <div
            key={attachment.id}
            className="px-3 border border-custom-border-200 rounded-[4px] py-2 flex justify-between items-center bg-custom-background-100"
          >
            <Link href={attachment.asset}>
              <a target="_blank" className="text-custom-text-200 truncate flex items-center">
                {isImage(attachment.attributes.name) ? (
                  <ImageIcon className="w-5 h-5 mr-2 flex-shrink-0 text-custom-text-400" />
                ) : (
                  <FileText className="w-5 h-5 mr-2 flex-shrink-0 text-custom-text-400" />
                )}
                <span className="truncate">{attachment.attributes.name}</span>
              </a>
            </Link>
            {allowed && (
              <button
                type="button"
                onClick={() => {
                  setDeleteAttachment(attachment);
                  setAttachmentDeleteModal(true);
                }}
              >
                <X className="w-[18px] h-[18px] text-custom-text-400" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          disabled={!allowed}
          onClick={() => setIsOpen(true)}
          className="bg-custom-primary-100/10 border border-dotted rounded-[4px] border-custom-primary-100 text-center py-2 w-full text-custom-primary-100"
        >
          Click to upload file here
        </button>
      </div>
    </div>
  );
};
