import { FileUp } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// plane imports
import { cn } from "@plane/utils";
// constants
import { ACCEPTED_ATTACHMENT_MIME_TYPES } from "@/constants/config";
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { EFileError } from "@/helpers/file";
import { getExtensionStorage } from "@/helpers/get-extension-storage";
// hooks
import { uploadFirstFileAndInsertRemaining, useDropZone, useUploader } from "@/hooks/use-file-upload";
// plane editor imports
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// local imports
import { EAttachmentBlockAttributeNames } from "../types";
import { getAttachmentExtensionErrorMap, getAttachmentExtensionFileMap } from "../utils";
import { CustomAttachmentNodeViewProps } from "./node-view";
import { CustomAttachmentUploaderDetails } from "./uploader-details";

export const CustomAttachmentUploader: React.FC<CustomAttachmentNodeViewProps> = (props) => {
  const { editor, extension, getPos, node, updateAttributes } = props;
  // states
  const [fileBeingUploaded, setFileBeingUploaded] = useState<File | null>(null);
  // refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredFilePickerRef = useRef(false);
  // derived values
  const { id: attachmentBlockId } = node.attrs;
  const maxFileSize = getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.ATTACHMENT)?.maxFileSize;
  const attachmentExtensionFileMap = useMemo(() => getAttachmentExtensionFileMap(editor), [editor]);
  const attachmentExtensionErrorMap = useMemo(() => getAttachmentExtensionErrorMap(editor), [editor]);

  // upload handler
  const onUpload = useCallback(
    (url: string, file: File) => {
      if (!url || !file || !attachmentBlockId) return;
      // update the node view's attributes post upload
      updateAttributes({
        [EAttachmentBlockAttributeNames.SOURCE]: url,
        [EAttachmentBlockAttributeNames.FILE_NAME]: file.name,
        [EAttachmentBlockAttributeNames.FILE_TYPE]: file.type,
        [EAttachmentBlockAttributeNames.FILE_SIZE]: file.size,
      });
      // delete from the attachment file map
      attachmentExtensionFileMap?.delete(attachmentBlockId);

      const pos = getPos();
      // get current node
      const getCurrentSelection = editor.state.selection;
      const currentNode = editor.state.doc.nodeAt(getCurrentSelection.from);

      // only if the cursor is at the current image component, manipulate
      // the cursor position
      if (currentNode && currentNode.type.name === node.type.name && currentNode.attrs.src === url) {
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attachmentBlockId, attachmentExtensionFileMap, updateAttributes, getPos]
  );

  const uploadAttachmentEditorCommand = useCallback(
    async (file: File) => {
      try {
        setFileBeingUploaded(file);
        return await extension.options.uploadAttachment?.(attachmentBlockId ?? "", file);
      } catch (error) {
        attachmentExtensionErrorMap?.set(attachmentBlockId ?? "", {
          error: EFileError.UPLOAD_FAILED,
          file,
        });
        console.error("Error in uploading attachment via uploader:", error);
      } finally {
        setFileBeingUploaded(null);
      }
    },
    [attachmentBlockId, attachmentExtensionErrorMap, extension.options]
  );

  const handleProgressStatus = useCallback(
    (isUploading: boolean) => {
      getExtensionStorage(editor, CORE_EXTENSIONS.UTILITY).uploadInProgress = isUploading;
    },
    [editor]
  );

  const handleInvalidFile = useCallback(
    (error: EFileError, file: File) => {
      attachmentExtensionErrorMap?.set(attachmentBlockId ?? "", {
        error,
        file,
      });
      setFileBeingUploaded(null);
    },
    [attachmentBlockId, attachmentExtensionErrorMap]
  );

  // file upload
  const { uploadFile } = useUploader({
    acceptedMimeTypes: ACCEPTED_ATTACHMENT_MIME_TYPES,
    editorCommand: uploadAttachmentEditorCommand,
    handleProgressStatus,
    maxFileSize,
    onInvalidFile: handleInvalidFile,
    onUpload,
  });
  // dropzone
  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({
    editor,
    pos: getPos(),
    type: "attachment",
    uploader: uploadFile,
  });

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const filesList = e.target.files;
      if (!filesList) return;

      await uploadFirstFileAndInsertRemaining({
        editor,
        filesList,
        pos: getPos(),
        type: "attachment",
        uploader: uploadFile,
      });
    },
    [editor, getPos, uploadFile]
  );

  // the meta data of the image component
  const meta = useMemo(
    () => attachmentExtensionFileMap?.get(attachmentBlockId ?? ""),
    [attachmentBlockId, attachmentExtensionFileMap]
  );

  // after the attachment component is mounted we start the upload process based on
  // its upload status
  useEffect(() => {
    if (!meta || !attachmentBlockId) return;

    if (meta.event === "drop" && "file" in meta) {
      uploadFile(meta.file);
    } else if (meta.event === "insert" && fileInputRef.current && !hasTriggeredFilePickerRef.current) {
      if (meta.hasOpenedFileInputOnce) return;
      fileInputRef.current.click();
      hasTriggeredFilePickerRef.current = true;
      attachmentExtensionFileMap?.set(attachmentBlockId, {
        ...meta,
        hasOpenedFileInputOnce: true,
      });
    }
  }, [attachmentBlockId, attachmentExtensionFileMap, meta, uploadFile]);

  return (
    <div
      className={cn(
        "py-3 px-2 rounded-lg bg-custom-background-90 border border-dashed border-custom-border-300 flex items-center gap-2 transition-colors cursor-default",
        {
          "hover:bg-custom-background-80 cursor-pointer": editor.isEditable,
          "bg-custom-background-80": editor.isEditable && draggedInside,
        }
      )}
      onDrop={onDrop}
      onDragOver={onDragEnter}
      onDragLeave={onDragLeave}
      contentEditable={false}
      onClick={() => {
        if (editor.isEditable && !fileBeingUploaded) fileInputRef.current?.click();
      }}
      role="button"
      // aria-label={t("attachmentComponent.aria.click_to_upload")}
      aria-label="Click to upload attachment"
      aria-disabled={!editor.isEditable}
    >
      <div className="flex-shrink-0 mt-1 size-8 grid place-items-center">
        <FileUp className="flex-shrink-0 size-8 text-custom-text-300" />
      </div>
      <CustomAttachmentUploaderDetails
        blockId={attachmentBlockId ?? ""}
        editor={editor}
        fileBeingUploaded={fileBeingUploaded}
        maxFileSize={maxFileSize}
      />
      <input
        className="size-0 overflow-hidden"
        ref={fileInputRef}
        hidden
        type="file"
        accept={ACCEPTED_ATTACHMENT_MIME_TYPES.join(",")}
        onChange={handleFileChange}
        multiple
      />
    </div>
  );
};
