import { ChangeEvent, useCallback, useEffect, useRef } from "react";
import { Editor } from "@tiptap/core";
import { ImageIcon } from "lucide-react";
// helpers
import { cn } from "@/helpers/common";
// hooks
import { useUploader, useFileUpload, useDropZone } from "@/hooks/use-file-upload";
// plugins
import { isFileValid } from "@/plugins/image";

type RefType = React.RefObject<HTMLInputElement> | ((instance: HTMLInputElement | null) => void);

const assignRef = (ref: RefType, value: HTMLInputElement | null) => {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref && typeof ref === "object") {
    (ref as React.MutableRefObject<HTMLInputElement | null>).current = value;
  }
};

export const CustomImageUploader = (props: {
  onUpload: (url: string) => void;
  editor: Editor;
  fileInputRef: RefType;
  existingFile?: File;
  selected: boolean;
}) => {
  const { selected, onUpload, editor, fileInputRef, existingFile } = props;
  const { loading, uploadFile } = useUploader({ onUpload, editor });
  const { handleUploadClick, ref: internalRef } = useFileUpload();
  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({ uploader: uploadFile });

  const localRef = useRef<HTMLInputElement | null>(null);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (isFileValid(file)) {
          uploadFile(file);
        }
      }
    },
    [uploadFile]
  );

  useEffect(() => {
    // no need to validate as the file is already validated before the drop onto
    // the editor
    if (existingFile) {
      uploadFile(existingFile);
    }
  }, [existingFile, uploadFile]);

  return (
    <div
      className={cn(
        "image-upload-component flex items-center justify-start gap-2 py-3 px-2 rounded-lg text-custom-text-300 hover:text-custom-text-200 bg-custom-background-90 hover:bg-custom-background-80 border border-dashed border-custom-border-300 cursor-pointer transition-all duration-200 ease-in-out",
        {
          "bg-custom-background-80 text-custom-text-200": draggedInside,
        },
        {
          "text-custom-primary-200 bg-custom-primary-100/10": selected,
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
        className="size-0 overflow-hidden"
        ref={(element) => {
          localRef.current = element;
          assignRef(fileInputRef, element);
          assignRef(internalRef as RefType, element);
        }}
        hidden
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={onFileChange}
      />
    </div>
  );
};
