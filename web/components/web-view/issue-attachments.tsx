// react
import React, { useState, useCallback } from "react";

// next
import Link from "next/link";
import { useRouter } from "next/router";

// swr
import useSWR, { mutate } from "swr";

// services
import issuesService from "services/issues.service";

// react dropzone
import { useDropzone } from "react-dropzone";

// fetch key
import { ISSUE_ATTACHMENTS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

// icons
import { FileText, ChevronRight, X, Image as ImageIcon } from "lucide-react";

// components
import { Label, WebViewModal } from "components/web-view";
import { DeleteAttachmentModal } from "components/issues";

// types
import type { IIssueAttachment } from "types";

type Props = {
  allowed: boolean;
};

const isImage = (fileName: string) => /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(fileName);

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
      if (!acceptedFiles[0] || !workspaceSlug) return;

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

      issuesService
        .uploadIssueAttachment(
          workspaceSlug as string,
          projectId as string,
          issueId as string,
          formData
        )
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
        .catch((err) => {
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
    [issueId, projectId, workspaceSlug]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: 5 * 1024 * 1024,
    disabled: !allowed || isLoading,
  });

  const { data: attachments } = useSWR<IIssueAttachment[]>(
    workspaceSlug && projectId && issueId ? ISSUE_ATTACHMENTS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesService.getIssueAttachment(
            workspaceSlug.toString(),
            projectId.toString(),
            issueId.toString()
          )
      : null
  );

  return (
    <div>
      <DeleteAttachmentModal
        isOpen={allowed && attachmentDeleteModal}
        setIsOpen={setAttachmentDeleteModal}
        data={deleteAttachment}
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
          onClick={() => setIsOpen(true)}
          className="bg-custom-primary-100/10 border border-dotted rounded-[4px] border-custom-primary-100 text-center py-2 w-full text-custom-primary-100"
        >
          Click to upload file here
        </button>
      </div>
    </div>
  );
};
