import { ImageIcon } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef } from "react";
// plane imports
import { cn } from "@plane/utils";
// constants
import { ACCEPTED_IMAGE_MIME_TYPES } from "@/constants/config";
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { EFileError } from "@/helpers/file";
// hooks
import { useUploader, useDropZone, uploadFirstFileAndInsertRemaining } from "@/hooks/use-file-upload";
// local imports
import { getImageComponentImageFileMap } from "../utils";
import type { CustomImageNodeViewProps } from "./node-view";

type CustomImageUploaderProps = CustomImageNodeViewProps & {
  failedToLoadImage: boolean;
  loadImageFromFileSystem: (file: string) => void;
  maxFileSize: number;
  setIsUploaded: (isUploaded: boolean) => void;
};

export const CustomImageUploader = (props: CustomImageUploaderProps) => {
  const {
    editor,
    extension,
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
  const isTouchDevice = !!editor.storage.utility.isTouchDevice;

  const onUpload = useCallback(
    (url: string) => {
      if (url) {
        if (!imageEntityId) return;
        setIsUploaded(true);
        // Update the node view's src attribute post upload
        updateAttributes({
          src: url,
        });
        imageComponentImageFileMap?.delete(imageEntityId);

        const pos = getPos();
        // get current node
        const getCurrentSelection = editor.state.selection;
        const currentNode = editor.state.doc.nodeAt(getCurrentSelection.from);

        // only if the cursor is at the current image component, manipulate
        // the cursor position
        if (
          currentNode &&
          currentNode.type.name === node.type.name &&
          currentNode.attrs.src === url &&
          pos !== undefined
        ) {
          // control cursor position after upload
          const nextNode = editor.state.doc.nodeAt(pos + 1);

          if (nextNode && nextNode.type.name === CORE_EXTENSIONS.PARAGRAPH) {
            // If there is a paragraph node after the image component, move the focus to the next node
            editor.commands.setTextSelection(pos + 1);
          } else {
            // create a new paragraph after the image component post upload
            editor.commands.createParagraphNear();
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [imageComponentImageFileMap, imageEntityId, updateAttributes, getPos]
  );

  const uploadImageEditorCommand = useCallback(
    async (file: File) => await extension.options.uploadImage?.(imageEntityId ?? "", file),
    [extension.options, imageEntityId]
  );

  const handleProgressStatus = useCallback(
    (isUploading: boolean) => {
      editor.storage.utility.uploadInProgress = isUploading;
    },
    [editor]
  );

  const handleInvalidFile = useCallback((_error: EFileError, _file: File, message: string) => {
    alert(message);
  }, []);

  // hooks
  const { isUploading: isImageBeingUploaded, uploadFile } = useUploader({
    acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
    editorCommand: uploadImageEditorCommand,
    handleProgressStatus,
    loadFileFromFileSystem: loadImageFromFileSystem,
    maxFileSize,
    onInvalidFile: handleInvalidFile,
    onUpload,
  });

  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({
    editor,
    getPos,
    type: "image",
    uploader: uploadFile,
  });

  // the meta data of the image component
  const meta = useMemo(
    () => imageComponentImageFileMap?.get(imageEntityId ?? ""),
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
        if (!isTouchDevice) {
          fileInputRef.current.click();
        }
        hasTriggeredFilePickerRef.current = true;
        imageComponentImageFileMap?.set(imageEntityId ?? "", { ...meta, hasOpenedFileInputOnce: true });
      }
    }
  }, [meta, uploadFile, imageComponentImageFileMap, imageEntityId, isTouchDevice]);

  const onFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const filesList = e.target.files;
      const pos = getPos();
      if (!filesList || pos === undefined) {
        return;
      }
      await uploadFirstFileAndInsertRemaining({
        editor,
        filesList,
        pos,
        type: "image",
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
  }, [draggedInside, editor.isEditable, failedToLoadImage, isImageBeingUploaded]);

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
        accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
        onChange={onFileChange}
        multiple
      />
    </div>
  );
};
