import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/core";
import { ImageIcon } from "lucide-react";
import { Spinner } from "@plane/ui";

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
  setIsImageLoaded: (isImageLoaded: boolean) => void;
  setDisplayedSrc: (displayedSrc: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}) => {
  const { selected, onUpload, editor, fileInputRef, existingFile, setDisplayedSrc, setIsImageLoaded, setIsLoading } =
    props;
  const { loading, uploadFile } = useUploader({ onUpload, editor });
  const { handleUploadClick, ref: internalRef } = useFileUpload();
  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({ uploader: uploadFile });
  const imageRef = useRef<HTMLImageElement>(null);

  const localRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  // state to track if the preview image is loaded

  useEffect(() => {
    if (previewUrl) {
      const closestEditorContainer = imageRef.current?.closest(".editor-container");
      if (closestEditorContainer) {
        const editorWidth = closestEditorContainer?.clientWidth;
        const initialWidth = Math.max(editorWidth * 0.35, 100);
        setWidth(initialWidth);
      }
    }
  }, [previewUrl, imageRef.current]);

  // Function to preload images
  const loadImage = useCallback((src: string) => {
    setIsImageLoaded(false);
    const img = new Image();
    img.onload = () => {
      setIsImageLoaded(true);
      setDisplayedSrc(src);
    };
    img.src = src;
  }, []);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (isFileValid(file)) {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            loadImage(result);
            setPreviewUrl(reader.result as string);
          };
          reader.readAsDataURL(file);
          uploadFile(file);
        }
      }
    },
    [uploadFile, editor.storage.image, loadImage]
  );

  useEffect(() => {
    if (existingFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        loadImage(result);
      };
      reader.readAsDataURL(existingFile);
      uploadFile(existingFile);
    }
  }, [existingFile, uploadFile, loadImage]);

  return (
    <>
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
          {loading
            ? "Uploading..."
            : draggedInside
              ? "Drop image here"
              : existingFile
                ? "Uploading..."
                : "Add an image"}
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
    </>
  );
};
