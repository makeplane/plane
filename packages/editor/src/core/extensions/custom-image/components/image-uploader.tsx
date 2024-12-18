import { ChangeEvent, useCallback, useEffect, useMemo, useRef } from "react";
import { ImageIcon } from "lucide-react";
// plane utils
import { cn } from "@plane/utils";
// constants
import { ACCEPTED_FILE_EXTENSIONS } from "@/constants/config";
// hooks
import { useUploader, useDropZone, uploadFirstImageAndInsertRemaining } from "@/hooks/use-file-upload";
// extensions
import { CustoBaseImageNodeViewProps, getImageComponentImageFileMap } from "@/extensions/custom-image";

type CustomImageUploaderProps = CustoBaseImageNodeViewProps & {
  maxFileSize: number;
  loadImageFromFileSystem: (file: string) => void;
  failedToLoadImage: boolean;
  setIsUploaded: (isUploaded: boolean) => void;
};

export const CustomImageUploader = (props: CustomImageUploaderProps) => {
  const {
    editor,
    failedToLoadImage,
    getPos,
    loadImageFromFileSystem,
    maxFileSize,
    node,
    selected,
    setIsUploaded,
    updateAttributes,
  } = props;
  // refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredFilePickerRef = useRef(false);
  const { id: imageEntityId } = node.attrs;
  // derived values
  const imageComponentImageFileMap = useMemo(() => getImageComponentImageFileMap(editor), [editor]);

  const onUpload = useCallback(
    (url: string) => {
      if (url) {
        setIsUploaded(true);
        // Update the node view's src attribute post upload
        updateAttributes({ src: url });
        imageComponentImageFileMap?.delete(imageEntityId);

        const pos = getPos();
        // get current node
        const getCurrentSelection = editor.state.selection;
        const currentNode = editor.state.doc.nodeAt(getCurrentSelection.from);

        // only if the cursor is at the current image component, manipulate
        // the cursor position
        if (currentNode && currentNode.type.name === "imageComponent" && currentNode.attrs.src === url) {
          // control cursor position after upload
          const nextNode = editor.state.doc.nodeAt(pos + 1);

          if (nextNode && nextNode.type.name === "paragraph") {
            // If there is a paragraph node after the image component, move the focus to the next node
            editor.commands.setTextSelection(pos + 1);
          } else {
            // create a new paragraph after the image component post upload
            editor.commands.createParagraphNear();
          }
        }
      }
    },
    [imageComponentImageFileMap, imageEntityId, updateAttributes, getPos]
  );
  // hooks
  const { uploading: isImageBeingUploaded, uploadFile } = useUploader({
    editor,
    loadImageFromFileSystem,
    maxFileSize,
    onUpload,
  });
  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({
    editor,
    maxFileSize,
    pos: getPos(),
    uploader: uploadFile,
  });

  // the meta data of the image component
  const meta = useMemo(
    () => imageComponentImageFileMap?.get(imageEntityId),
    [imageComponentImageFileMap, imageEntityId]
  );

  // after the image component is mounted we start the upload process based on
  // it's uploaded
  useEffect(() => {
    if (meta) {
      if (meta.event === "drop" && "file" in meta) {
        uploadFile(meta.file);
      } else if (meta.event === "insert" && fileInputRef.current && !hasTriggeredFilePickerRef.current) {
        if (meta.hasOpenedFileInputOnce) return;
        fileInputRef.current.click();
        hasTriggeredFilePickerRef.current = true;
        imageComponentImageFileMap?.set(imageEntityId, { ...meta, hasOpenedFileInputOnce: true });
      }
    }
  }, [meta, uploadFile, imageComponentImageFileMap]);

  const onFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const filesList = e.target.files;
      if (!filesList) {
        return;
      }
      await uploadFirstImageAndInsertRemaining({
        editor,
        filesList,
        maxFileSize,
        pos: getPos(),
        uploader: uploadFile,
      });
    },
    [uploadFile, editor, getPos]
  );

  const getDisplayMessage = useCallback(() => {
    const isUploading = isImageBeingUploaded;
    if (failedToLoadImage) {
      return "Error loading image";
    }

    if (isUploading) {
      return "Uploading...";
    }

    if (draggedInside && editor.isEditable) {
      return "Drop image here";
    }

    return "Add an image";
  }, [draggedInside, failedToLoadImage, isImageBeingUploaded]);

  return (
    <div
      className={cn(
        "image-upload-component flex items-center justify-start gap-2 py-3 px-2 rounded-lg text-custom-text-300 bg-custom-background-90 border border-dashed border-custom-border-300 transition-all duration-200 ease-in-out cursor-default",
        {
          "hover:text-custom-text-200 hover:bg-custom-background-80 cursor-pointer": editor.isEditable,
          "bg-custom-background-80 text-custom-text-200": draggedInside && editor.isEditable,
          "text-custom-primary-200 bg-custom-primary-100/10 border-custom-primary-200/10 hover:bg-custom-primary-100/10 hover:text-custom-primary-200":
            selected && editor.isEditable,
          "text-red-500 cursor-default": failedToLoadImage,
          "hover:text-red-500": failedToLoadImage && editor.isEditable,
          "bg-red-500/10": failedToLoadImage && selected,
          "hover:bg-red-500/10": failedToLoadImage && selected && editor.isEditable,
        }
      )}
      onDrop={onDrop}
      onDragOver={onDragEnter}
      onDragLeave={onDragLeave}
      contentEditable={false}
      onClick={() => {
        if (!failedToLoadImage && editor.isEditable) {
          fileInputRef.current?.click();
        }
      }}
    >
      <ImageIcon className="size-4" />
      <div className="text-base font-medium">{getDisplayMessage()}</div>
      <input
        className="size-0 overflow-hidden"
        ref={fileInputRef}
        hidden
        type="file"
        accept={ACCEPTED_FILE_EXTENSIONS.join(",")}
        onChange={onFileChange}
        multiple
      />
    </div>
  );
};
