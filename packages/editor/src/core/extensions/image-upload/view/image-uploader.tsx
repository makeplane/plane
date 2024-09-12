import { ChangeEvent, useCallback, useEffect, useRef } from "react";
import { Editor } from "@tiptap/core";
import { ImageIcon } from "lucide-react";
// helpers
import { cn } from "@/helpers/common";
// hooks
import { useUploader, useFileUpload, useDropZone } from "@/hooks/use-file-upload";

type RefType = React.RefObject<HTMLInputElement> | ((instance: HTMLInputElement | null) => void);

const assignRef = (ref: RefType, value: HTMLInputElement | null) => {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref && typeof ref === "object") {
    (ref as React.MutableRefObject<HTMLInputElement | null>).current = value;
  }
};

export const ImageUploader = ({
  onUpload,
  editor,
  fileInputRef,
  existingFile,
}: {
  onUpload: (url: string) => void;
  editor: Editor;
  fileInputRef: RefType;
  existingFile?: File;
}) => {
  const { loading, uploadFile } = useUploader({ onUpload, editor });
  const { handleUploadClick, ref: internalRef } = useFileUpload();
  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({ uploader: uploadFile });

  const localRef = useRef<HTMLInputElement | null>(null);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => (e.target.files ? uploadFile(e.target.files[0]) : null),
    [uploadFile]
  );

  useEffect(() => {
    if (existingFile) {
      uploadFile(existingFile);
    }
  }, [existingFile, uploadFile]);

  return (
    <div
      className={cn(
        "flex items-center justify-start gap-2 py-3 px-2 rounded-lg text-custom-text-300 hover:text-custom-text-200 bg-custom-background-90 hover:bg-custom-background-80 border border-dashed border-custom-border-300 cursor-pointer transition-all duration-200 ease-in-out",
        {
          "bg-custom-background-80 text-custom-text-200": draggedInside,
        }
      )}
      onDrop={onDrop}
      onDragOver={onDragEnter}
      onDragLeave={onDragLeave}
      contentEditable={false}
      onClick={handleUploadClick}
    >
      <ImageIcon className="size-4" />
      <div className="text-base font-medium">
        {loading ? "Uploading..." : draggedInside ? "Drop image here" : existingFile ? "Uploading..." : "Add an image"}
      </div>
      <input
        className="size-0 overflow-hidden opacity-0"
        ref={(element) => {
          localRef.current = element;
          assignRef(fileInputRef, element);
          assignRef(internalRef as RefType, element);
        }}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={onFileChange}
      />
    </div>
  );
};

export default ImageUploader;
