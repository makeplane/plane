/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { FileUp, RotateCcw } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// plane imports
import { AttachmentUploadFailedIcon, VideoFileIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { EFileError } from "@/helpers/file";
// hooks
import { uploadFirstFileAndInsertRemaining, useDropZone, useUploader } from "@/hooks/use-file-upload";
// local imports
import { EAttachmentBlockAttributeNames, EAttachmentStatus } from "../types";
import { getAttachmentExtensionFileMap, getMimeTypesFromFileType } from "../utils";
import type { CustomAttachmentNodeViewProps } from "./node-view";
import { CustomAttachmentUploaderDetails } from "./uploader-details";

type CustomAttachmentUploaderProps = CustomAttachmentNodeViewProps & {
  hasDuplicationFailed?: boolean;
};

export function CustomAttachmentUploader(props: CustomAttachmentUploaderProps) {
  const { editor, extension, getPos, node, updateAttributes, hasDuplicationFailed = false, selected } = props;

  // states
  const [fileBeingUploaded, setFileBeingUploaded] = useState<File | null>(null);
  const [fileUploadError, setFileUploadError] = useState<{ error: EFileError; file: File } | null>(null);
  // refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredFilePickerRef = useRef(false);
  const hasTriedUploadingOnMountRef = useRef(false);

  // derived values
  const { id: attachmentBlockId } = node.attrs;
  const maxFileSize = editor.storage.attachmentComponent?.maxFileSize;
  const attachmentExtensionFileMap = useMemo(() => getAttachmentExtensionFileMap(editor), [editor]);
  const isTouchDevice = !!editor.storage.utility.isTouchDevice;

  // extension options
  const { onClick } = extension.options;
  // get accepted file type from node attributes or default to "all"
  const acceptedFileType = node.attrs[EAttachmentBlockAttributeNames.ACCEPTED_FILE_TYPE] ?? "all";
  const acceptedMimeTypes = getMimeTypesFromFileType(acceptedFileType);
  const isVideoUploader = acceptedFileType === "video";
  // get meta for event tracking

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
        [EAttachmentBlockAttributeNames.STATUS]: EAttachmentStatus.UPLOADED,
      });
      // delete from the attachment file map
      attachmentExtensionFileMap?.delete(attachmentBlockId);

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
    },
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [attachmentBlockId, attachmentExtensionFileMap, updateAttributes, getPos]
  );

  const uploadAttachmentEditorCommand = useCallback(
    async (file: File) => {
      try {
        updateAttributes({ [EAttachmentBlockAttributeNames.STATUS]: EAttachmentStatus.UPLOADING });
        setFileBeingUploaded(file);
        return await extension.options.uploadAttachment?.(attachmentBlockId ?? "", file);
      } catch (error) {
        setFileUploadError({ error: EFileError.UPLOAD_FAILED, file });
        console.error("Error in uploading attachment via uploader:", error);
        // Reset status to PENDING on error so user can retry
        updateAttributes({ [EAttachmentBlockAttributeNames.STATUS]: EAttachmentStatus.PENDING });
      } finally {
        setFileBeingUploaded(null);
      }
    },
    [attachmentBlockId, extension.options, updateAttributes]
  );

  const handleProgressStatus = useCallback(
    (isUploading: boolean) => {
      editor.storage.utility.uploadInProgress = isUploading;
    },
    [editor]
  );

  const handleInvalidFile = useCallback((error: EFileError, file: File, _message: string) => {
    setFileUploadError({ error, file });
    setFileBeingUploaded(null);
  }, []);

  // file upload
  const { uploadFile } = useUploader({
    acceptedMimeTypes,
    editorCommand: uploadAttachmentEditorCommand,
    handleProgressStatus,
    maxFileSize,
    onInvalidFile: handleInvalidFile,
    onUpload,
  });
  // dropzone
  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({
    editor,
    getPos,
    type: "attachment",
    uploader: uploadFile,
  });

  const isErrorState = !!fileUploadError || hasDuplicationFailed;

  const borderColor =
    selected && editor.isEditable && !isErrorState
      ? "color-mix(in srgb, var(--border-color-accent-strong) 20%, transparent)"
      : undefined;

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const filesList = e.target.files;
      const pos = getPos();
      if (!filesList || pos === undefined) return;

      // Clear any existing errors when selecting new files
      setFileUploadError(null);

      await uploadFirstFileAndInsertRemaining({
        editor,
        filesList,
        pos,
        type: "attachment",
        uploader: uploadFile,
      });
    },
    [editor, getPos, uploadFile]
  );

  // after the attachment component is mounted we start the upload process based on
  // its upload status
  useEffect(() => {
    if (hasTriedUploadingOnMountRef.current) return;

    if (!attachmentBlockId) return;
    const meta = attachmentExtensionFileMap?.get(attachmentBlockId);
    if (meta) {
      if (meta.event === "drop" && "file" in meta) {
        hasTriedUploadingOnMountRef.current = true;
        uploadFile(meta.file);
      } else if (meta.event === "insert" && fileInputRef.current && !hasTriggeredFilePickerRef.current) {
        if (meta.hasOpenedFileInputOnce) return;
        fileInputRef.current.click();
        hasTriggeredFilePickerRef.current = true;
        attachmentExtensionFileMap?.set(attachmentBlockId, {
          ...meta,
          hasOpenedFileInputOnce: true,
        });
      } else {
        hasTriedUploadingOnMountRef.current = true;
      }
    }
  }, [attachmentBlockId, attachmentExtensionFileMap, uploadFile]);

  return (
    <div
      className={cn(
        "py-3 px-2 rounded-lg bg-layer-3 border border-dashed transition-all duration-200 ease-in-out cursor-default flex items-center gap-2",
        {
          "border-subtle-1": !(selected && editor.isEditable && !isErrorState),
          "hover:text-secondary hover:bg-layer-3-hover cursor-pointer": editor.isEditable && !isErrorState,
          "bg-layer-3-hover text-secondary": draggedInside && editor.isEditable && !isErrorState,
          "text-accent-secondary bg-accent-primary/10 border-accent-strong-200/10 hover:bg-accent-primary/10 hover:text-accent-secondary":
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
        if (isTouchDevice) onClick?.();
        else if (editor.isEditable && !fileBeingUploaded && !isErrorState) fileInputRef.current?.click();
      }}
      role="button"
      // aria-label={t("attachmentComponent.aria.click_to_upload")}
      aria-label="Click to upload attachment"
      aria-disabled={!editor.isEditable}
    >
      <div className="shrink-0 mt-1 size-8 grid place-items-center">
        {isVideoUploader ? (
          <VideoFileIcon className="shrink-0 size-8 text-tertiary" />
        ) : hasDuplicationFailed || fileUploadError ? (
          <AttachmentUploadFailedIcon className="shrink-0 size-8 text-custom-text-300" />
        ) : (
          <FileUp className="shrink-0 size-8 text-tertiary" />
        )}
      </div>
      <CustomAttachmentUploaderDetails
        blockId={attachmentBlockId ?? ""}
        editor={editor}
        fileBeingUploaded={fileBeingUploaded}
        fileUploadError={fileUploadError}
        hasDuplicationFailed={hasDuplicationFailed}
        maxFileSize={maxFileSize}
      />
      {hasDuplicationFailed && editor.isEditable && (
        <button
          type="button"
          onClick={() => {
            if (hasDuplicationFailed && editor.isEditable) {
              updateAttributes({ [EAttachmentBlockAttributeNames.STATUS]: EAttachmentStatus.DUPLICATING });
            }
          }}
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-11 font-medium text-tertiary hover:bg-layer-2-hover hover:text-secondary rounded-md transition-all duration-200 ease-in-out",
            {
              "hover:bg-red-500/20": selected,
            }
          )}
          title="Retry duplication"
        >
          <RotateCcw className="size-3" />
          Retry
        </button>
      )}
      <input
        className="size-0 overflow-hidden"
        ref={fileInputRef}
        hidden
        type="file"
        accept={acceptedMimeTypes.join(",")}
        onChange={handleFileChange}
        multiple
      />
    </div>
  );
}
