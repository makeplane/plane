import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
import { useDropzone } from "react-dropzone";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { IssueAttachmentService } from "services/issue";
// hooks
import useToast from "hooks/use-toast";
// types
import { IIssueAttachment } from "types";
// fetch-keys
import { ISSUE_ATTACHMENTS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";
// constants
import { MAX_FILE_SIZE } from "constants/common";

type Props = {
  disabled?: boolean;
};

const issueAttachmentService = new IssueAttachmentService();

export const IssueAttachmentUpload: React.FC<Props> = observer((props) => {
  const { disabled = false } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { setToastAlert } = useToast();

  const {
    appConfig: { envConfig },
  } = useMobxStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
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

    issueAttachmentService
      .uploadIssueAttachment(workspaceSlug as string, projectId as string, issueId as string, formData)
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
      .catch(() => {
        setIsLoading(false);
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
    maxSize: envConfig?.file_size_limit ?? MAX_FILE_SIZE,
    multiple: false,
    disabled: isLoading || disabled,
  });

  const maxFileSize = envConfig?.file_size_limit ?? MAX_FILE_SIZE;

  const fileError =
    fileRejections.length > 0 ? `Invalid file type or size (max ${maxFileSize / 1024 / 1024} MB)` : null;

  return (
    <div
      {...getRootProps()}
      className={`flex h-[60px] items-center justify-center rounded-md border-2 border-dashed bg-custom-primary/5 px-4 text-xs text-custom-primary ${
        isDragActive ? "border-custom-primary bg-custom-primary/10" : "border-custom-border-200"
      } ${isDragReject ? "bg-red-100" : ""} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <input {...getInputProps()} />
      <span className="flex items-center gap-2">
        {isDragActive ? (
          <p>Drop here...</p>
        ) : fileError ? (
          <p className="text-center text-red-500">{fileError}</p>
        ) : isLoading ? (
          <p className="text-center">Uploading...</p>
        ) : (
          <p className="text-center">Click or drag a file here</p>
        )}
      </span>
    </div>
  );
});
