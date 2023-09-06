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

// hooks
import useToast from "hooks/use-toast";

// icons
import { ChevronRightIcon } from "@heroicons/react/24/outline";

// components
import { Label, WebViewModal } from "components/web-view";

// types
import type { IIssueAttachment } from "types";

type Props = {
  allowed: boolean;
};

export const IssueAttachments: React.FC<Props> = (props) => {
  const { allowed } = props;

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setToastAlert } = useToast();

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
          setToastAlert({
            type: "success",
            title: "Success!",
            message: "File added successfully.",
          });
          setIsLoading(false);
        })
        .catch((err) => {
          setIsLoading(false);
          setToastAlert({
            type: "error",
            title: "error!",
            message: "Something went wrong. please check file type & size (max 5 MB)",
          });
        });
    },
    [issueId, projectId, setToastAlert, workspaceSlug]
  );

  const { getRootProps } = useDropzone({
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
      <WebViewModal isOpen={isOpen} onClose={() => setIsOpen(false)} modalTitle="Insert file">
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-b w-full py-2 text-custom-text-100 px-2 flex justify-between items-center ${
              !allowed || isLoading ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {isLoading ? (
              <p className="text-center">Uploading...</p>
            ) : (
              <>
                <h3 className="text-lg">Upload</h3>
                <ChevronRightIcon className="w-5 h-5" />
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
              <a target="_blank" className="text-custom-text-200 truncate">
                {attachment.attributes.name}
              </a>
            </Link>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-custom-primary-100/10 border border-dotted border-custom-primary-100 text-center py-2 w-full text-custom-primary-100"
        >
          Click to upload file here
        </button>
      </div>
    </div>
  );
};
