/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
// plane web hooks
import { useFileSize } from "@/hooks/use-file-size";
// types
import type { TAttachmentOperations } from "../issue-detail-widgets/attachments/helper";
import { useAttachmentDropHandler } from "../issue-detail-widgets/attachments/helper";

type TAttachmentOperationsModal = Pick<TAttachmentOperations, "create">;

type Props = {
  workspaceSlug: string;
  disabled?: boolean;
  attachmentOperations: TAttachmentOperationsModal;
};

export const IssueAttachmentUpload = observer(function IssueAttachmentUpload(props: Props) {
  const { workspaceSlug, disabled = false, attachmentOperations } = props;
  // file size
  const { maxFileSize } = useFileSize();
  // drop handler
  const { onDrop, progress, isUploading } = useAttachmentDropHandler({
    create: attachmentOperations.create,
    maxFileSize,
  });

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    multiple: true,
    disabled: isUploading || disabled || !workspaceSlug,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex h-[60px] items-center justify-center rounded-md border-2 border-dashed bg-accent-primary/5 px-4 text-11 text-accent-primary ${
        isDragActive ? "border-accent-strong bg-accent-primary/10" : "border-subtle"
      } ${isDragReject ? "bg-danger-subtle" : ""} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <input {...getInputProps()} />
      <span className="flex items-center gap-2">
        {isDragActive ? (
          <p>Drop here...</p>
        ) : progress ? (
          <p className="text-center">
            {progress.total > 1
              ? `Uploading ${Math.min(progress.completed + 1, progress.total)}/${progress.total}...`
              : "Uploading..."}
          </p>
        ) : (
          <p className="text-center">Click or drag files here</p>
        )}
      </span>
    </div>
  );
});
