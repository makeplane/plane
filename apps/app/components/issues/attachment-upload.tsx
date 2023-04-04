import React, { useCallback, useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-dropzone
import { useDropzone } from "react-dropzone";
// toast
import useToast from "hooks/use-toast";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// fetch key
import { ISSUE_ATTACHMENTS } from "constants/fetch-keys";
// services
import fileServices from "services/file.service";

// const acceptedFileTypes = ["application/pdf", "text/csv", "application/vnd.ms-excel"];
const maxFileSize = 5 * 1024 * 1024; // 5 MB

export const IssueAttachmentUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { setToastAlert } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles[0] || !workspaceSlug) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append("asset", acceptedFiles[0]);
    formData.append(
      "attributes",
      JSON.stringify({
        name: acceptedFiles[0].name,
        size: acceptedFiles[0].size,
      })
    );

    fileServices
      .uploadIssueAttachment(
        workspaceSlug as string,
        projectId as string,
        issueId as string,
        formData
      )
      .then((res) => {
        mutate(ISSUE_ATTACHMENTS(issueId as string));
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "File added successfully.",
        });
        setIsLoading(false);
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "error!",
          message: "Something went wrong. please check file type & size (max 5 MB)",
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    multiple: false,
  });

  const fileError =
    fileRejections.length > 0
      ? `Invalid file type or size (max ${maxFileSize / 1024 / 1024} MB)`
      : null;

  return (
    <div
      {...getRootProps()}
      className={`flex items-center justify-center cursor-pointer border-2 border-dashed border-theme text-blue-500 text-sm rounded-md px-4 py-2 ${
        isDragActive ? "bg-theme/10" : ""
      } ${isDragReject ? "bg-red-100" : ""}`}
    >
      <input {...getInputProps()} />
      <span className="flex items-center gap-2">
        
        {isDragActive ? (
          <p>Drop here...</p>
        ) : isLoading ? (<p className="text-center">Uploading....</p>) : (
          <>
          {/* <PlusIcon className="h-5 w-5 text-blue-500" /> */}
          <p className="text-center">Drag & Drop or Click to add new file</p>
          </>
        )}
        {fileError && <p className="text-red-500 mt-2">{fileError}</p>}
      </span>
    </div>
  );
};
