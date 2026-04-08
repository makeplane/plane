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

import type { Dispatch, SetStateAction } from "react";
import React, { useCallback, useState, useEffect } from "react";
import { observer } from "mobx-react";
import type { FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
// plane web hooks
import { cn } from "@plane/utils";
import { getFileIcon } from "@/components/icons";
import { useAiFlag } from "@/plane-web/hooks/store/use-ai-flag";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { useFileSize } from "@/plane-web/hooks/use-file-size";
import type { TFocus, TPiAttachment } from "@/types/pi-chat";

type Props = {
  disabled?: boolean;
  workspaceSlug: string;
  workspaceId: string;
  chatId: string | undefined;
  isProjectLevel: boolean;
  focus: TFocus;
  mode: string;
  showBg: boolean;
  createNewChat: () => Promise<string>;
  setAttachments: Dispatch<SetStateAction<TPiAttachment[]>>;
  children: (isUploading: boolean, open: () => void) => React.ReactNode;
};

export const DndWrapper = observer(function DndWrapper(props: Props) {
  const {
    workspaceSlug,
    workspaceId,
    chatId,
    disabled = false,
    setAttachments,
    isProjectLevel,
    createNewChat,
    focus,
    mode,
    children,
    showBg,
  } = props;

  // state
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileIcon = getFileIcon("", 60);

  // store hooks
  const {
    attachmentStore: { createAttachment },
  } = usePiChat();
  const isFileUploadsEnabled = useAiFlag(workspaceSlug, E_FEATURE_FLAGS.AI_FILE_UPLOADS);

  // file size
  const { maxFileSize } = useFileSize();
  // onDrop handler
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      let successCount = 0;
      if (rejectedFiles.length === 0) {
        setIsUploading(true);
        let chatIdToUse = chatId;
        if (!chatIdToUse) chatIdToUse = await createNewChat();
        for (const file of acceptedFiles) {
          const currentFile: File = file;
          if (!currentFile) return;
          await createAttachment(currentFile, workspaceId, chatIdToUse)
            .then((res: TPiAttachment | void) => {
              if (!res) return;
              setAttachments((prev) => [...prev, res]);
              successCount++;
              return;
            })
            .catch((e: unknown) => {
              const error = e as { detail?: string };
              setToast({
                type: TOAST_TYPE.ERROR,
                title: `Failed to upload ${currentFile.name?.slice(0, 20)}...`,
                message:
                  typeof error?.detail === "string" ? error.detail : "File could not be attached. Try uploading again.",
              });
            });
        }
        setIsUploading(false);
      } else {
        for (const file of rejectedFiles) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: `Failed to upload ${file.file.name?.slice(0, 20)}...`,
            message:
              file.errors.length > 0 && typeof file.errors[0]?.message === "string"
                ? file.errors[0]?.message
                : "File could not be attached. Try uploading again.",
          });
        }
      }

      if (successCount > 0) {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: `Successfully uploaded`,
          message: `${successCount} attachment(s) have been successfully uploaded`,
        });
      }
      return;
    },
    [chatId, isProjectLevel, workspaceId, focus, createAttachment, createNewChat, mode, setAttachments]
  );

  // useDropzone: noClick true so root div won't open file dialog (button will)
  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: (acceptedFiles, rejectedFiles) => void onDrop(acceptedFiles, rejectedFiles),
    maxSize: maxFileSize,
    multiple: true,
    disabled: isUploading || disabled || !isFileUploadsEnabled,
    noClick: true, // prevent root div from opening file dialog on click
    noKeyboard: false,
    accept: {
      "image/*": [".png", ".gif", ".jpeg", ".webp"],
      "application/pdf": [".pdf"],
    },
  });

  useEffect(() => {
    if (!isFileUploadsEnabled) return;
    let dragCounter = 0; // keeps track of nested dragenter/dragleave events

    const isFileDrag = (e: DragEvent) => Array.from(e.dataTransfer?.types || []).includes("Files");

    const handleDragEnter = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      dragCounter++;
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [isFileUploadsEnabled]);
  return (
    <>
      <div
        {...getRootProps({
          role: "button",
          tabIndex: 0,
          "aria-label": "Drop files here to upload",
          className: cn(
            "relative w-full rounded-t-2xl border border-transparent text-sm transition-colors focus:outline-none",
            {
              "border-dashed border-accent-strong bg-accent-primary/10": isDragging,
              "bg-layer-1": showBg,
            }
          ),
        })}
      >
        <input {...getInputProps()} />
        {isDragging && (
          <div className="w-full h-full bg-layer-1 z-30 absolute top-0 left-0 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-center gap-4 h-full bg-accent-primary/10">
              {fileIcon}
              <span className="text-14 text-accent-primary">Drop any files here to add to chat</span>
            </div>
          </div>
        )}
        {children(isUploading, open)}
      </div>
    </>
  );
});
