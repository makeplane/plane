import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
// constants
import { MAX_FILE_SIZE } from "@/constants/common";
// helpers
import { generateFileName } from "@/helpers/attachment.helper";
// hooks
import { useInstance } from "@/hooks/store";
// types
import { TAttachmentOperations } from "./root";

type TAttachmentOperationsModal = Exclude<TAttachmentOperations, "remove">;

type Props = {
  workspaceSlug: string;
  disabled?: boolean;
  handleAttachmentOperations: TAttachmentOperationsModal;
};

export const IssueAttachmentUpload: React.FC<Props> = observer((props) => {
  const { workspaceSlug, disabled = false, handleAttachmentOperations } = props;
  // store hooks
  const { config } = useInstance();
  // states
  const [isLoading, setIsLoading] = useState(false);

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

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    maxSize: config?.file_size_limit ?? MAX_FILE_SIZE,
    multiple: false,
    disabled: isLoading || disabled,
  });

  const maxFileSize = config?.file_size_limit ?? MAX_FILE_SIZE;

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
