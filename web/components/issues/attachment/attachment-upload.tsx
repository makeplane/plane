import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { useDropzone } from "react-dropzone";
// hooks
import { useApplication } from "hooks/store";
// constants
import { MAX_FILE_SIZE } from "constants/common";
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
  const {
    config: { envConfig },
  } = useApplication();
  // states
  const [isLoading, setIsLoading] = useState(false);

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
    handleAttachmentOperations.create(formData).finally(() => setIsLoading(false));
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
