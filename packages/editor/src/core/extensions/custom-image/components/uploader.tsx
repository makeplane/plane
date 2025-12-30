import { ImageIcon, RotateCcw } from "lucide-react";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
// plane imports
import { cn } from "@plane/utils";
// constants
import { ACCEPTED_IMAGE_MIME_TYPES } from "@/constants/config";
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import type { EFileError } from "@/helpers/file";
// hooks
import { useUploader, useDropZone, uploadFirstFileAndInsertRemaining } from "@/hooks/use-file-upload";
// local imports
import { ECustomImageStatus } from "../types";
import { getImageComponentImageFileMap } from "../utils";
import type { CustomImageNodeViewProps } from "./node-view";

type CustomImageUploaderProps = CustomImageNodeViewProps & {
  failedToLoadImage: boolean;
  hasDuplicationFailed: boolean;
  loadImageFromFileSystem: (file: string) => void;
  maxFileSize: number;
  setIsUploaded: (isUploaded: boolean) => void;
};

export function CustomImageUploader(props: CustomImageUploaderProps) {
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
    hasDuplicationFailed,
  } = props;
  // refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredFilePickerRef = useRef(false);
  const hasTriedUploadingOnMountRef = useRef(false);
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
          status: ECustomImageStatus.UPLOADED,
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
    async (file: File) => {
      updateAttributes({ status: ECustomImageStatus.UPLOADING });
      return await extension.options.uploadImage?.(imageEntityId ?? "", file);
    },
    [extension.options, imageEntityId, updateAttributes]
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

  // after the image component is mounted we start the upload process based on
  // it's uploaded
  useEffect(() => {
    if (hasTriedUploadingOnMountRef.current) return;

    // the meta data of the image component
    const meta = imageComponentImageFileMap?.get(imageEntityId ?? "");
    if (meta) {
      if (meta.event === "drop" && "file" in meta) {
        hasTriedUploadingOnMountRef.current = true;
        uploadFile(meta.file);
      } else if (meta.event === "insert" && fileInputRef.current && !hasTriggeredFilePickerRef.current) {
        if (meta.hasOpenedFileInputOnce) return;
        if (!isTouchDevice) {
          fileInputRef.current.click();
        }
        hasTriggeredFilePickerRef.current = true;
        imageComponentImageFileMap?.set(imageEntityId ?? "", { ...meta, hasOpenedFileInputOnce: true });
      }
    } else {
      hasTriedUploadingOnMountRef.current = true;
    }
  }, [imageEntityId, isTouchDevice, uploadFile, imageComponentImageFileMap]);

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

  const isErrorState = failedToLoadImage || hasDuplicationFailed;

  const borderColor =
    selected && editor.isEditable && !isErrorState
      ? "color-mix(in srgb, var(--border-color-accent-strong) 20%, transparent)"
      : undefined;

  const getDisplayMessage = useCallback(() => {
    const isUploading = isImageBeingUploaded;
    if (isErrorState) {
      return "Error loading image";
    }

    if (isUploading) {
      return "Uploading...";
    }

    if (draggedInside && editor.isEditable) {
      return "Drop image here";
    }

    return "Add an image";
  }, [draggedInside, editor.isEditable, isErrorState, isImageBeingUploaded]);

  const handleRetryClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasDuplicationFailed && editor.isEditable) {
        updateAttributes({ status: ECustomImageStatus.DUPLICATING });
      }
    },
    [hasDuplicationFailed, editor.isEditable, updateAttributes]
  );

  return (
    <div
      className={cn(
        "image-upload-component flex items-center justify-start gap-2 py-3 px-2 rounded-lg text-tertiary bg-layer-3 border border-dashed transition-all duration-200 ease-in-out cursor-default",
        {
          "border-subtle": !(selected && editor.isEditable && !isErrorState),
          "hover:text-secondary hover:bg-layer-3-hover cursor-pointer": editor.isEditable && !isErrorState,
          "bg-layer-3-hover text-secondary": draggedInside && editor.isEditable && !isErrorState,
          "text-accent-secondary bg-accent-primary/10 hover:bg-accent-primary/10 hover:text-accent-secondary":
            selected && editor.isEditable && !isErrorState,
          "text-danger-primary bg-danger-subtle cursor-default": isErrorState,
          "hover:text-danger-primary hover:bg-danger-subtle-hover": isErrorState && editor.isEditable,
          "bg-danger-subtle-selected": isErrorState && selected,
          "hover:bg-danger-subtle-active": isErrorState && selected && editor.isEditable,
        }
      )}
      style={borderColor ? { borderColor } : undefined}
      onDrop={onDrop}
      onDragOver={onDragEnter}
      onDragLeave={onDragLeave}
      contentEditable={false}
      onClick={() => {
        if (!failedToLoadImage && editor.isEditable && !hasDuplicationFailed) {
          fileInputRef.current?.click();
        }
      }}
    >
      <ImageIcon className="size-4" />
      <div className="text-14 font-medium flex-1">{getDisplayMessage()}</div>
      {hasDuplicationFailed && editor.isEditable && (
        <button
          type="button"
          onClick={handleRetryClick}
          className={cn(
            "flex items-center gap-1 px-2 py-1 font-medium text-danger-primary rounded-md transition-all duration-200 ease-in-out hover:bg-danger-subtle-hover",
            {
              "hover:bg-danger-subtle-hover": selected,
            }
          )}
          title="Retry duplication"
        >
          <RotateCcw className="size-3" />
          <span className="text-11">Retry</span>
        </button>
      )}
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
}
