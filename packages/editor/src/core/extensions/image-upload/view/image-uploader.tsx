import { ChangeEvent, useCallback, useEffect } from "react";
import { Editor } from "@tiptap/core";
import { ImageIcon } from "lucide-react";
import { cn } from "@/helpers/common";
import { useDropZone, useFileUpload, useUploader } from "../../../hooks/use-file-upload";

export const ImageUploader = ({
  onUpload,
  editor,
  fileInputRef,
  existingFile,
}: {
  onUpload: (url: string) => void;
  editor: Editor;
  fileInputRef: React.RefObject<HTMLInputElement> | ((ref: HTMLInputElement) => void);
  existingFile?: File;
}) => {
  const { loading, uploadFile } = useUploader({ onUpload, editor });
  const { handleUploadClick, ref: internalRef } = useFileUpload();
  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({ uploader: uploadFile });

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => (e.target.files ? uploadFile(e.target.files[0]) : null),
    [uploadFile]
  );

  useEffect(() => {
    if (existingFile) {
      uploadFile(existingFile);
    }
  }, [existingFile, uploadFile]);

  const wrapperClass = cn(
    "flex justify-start px-2 py-2 rounded-lg bg-opacity-80 border-2 border-dotted border-custom-border-400 cursor-pointer gap-2",
    "transition-all duration-200 ease-in-out",
    "hover:bg-custom-background-80 hover:border-custom-border-200",
    draggedInside && "bg-custom-background-80"
  );

  return (
    <div
      className={wrapperClass}
      onDrop={onDrop}
      onDragOver={onDragEnter}
      onDragLeave={onDragLeave}
      contentEditable={false}
      onClick={handleUploadClick}
    >
      <ImageIcon name="Image" className="h-4 w-4 text-custom-text-200" />
      <div className="text-sm font-medium text-center">
        {loading ? "Uploading..." : draggedInside ? "Drop image here" : existingFile ? "Uploading..." : "Add an image"}
      </div>
      <input
        className="w-0 h-0 overflow-hidden opacity-0"
        ref={(el) => {
          internalRef.current = el;
          if (typeof fileInputRef === "function") {
            fileInputRef(el);
          } else if (fileInputRef) {
            fileInputRef.current = el;
          }
        }}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={onFileChange}
      />
    </div>
  );
};

export default ImageUploader;
