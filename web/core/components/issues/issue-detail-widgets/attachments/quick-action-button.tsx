"use client";
import React, { FC, useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import { Plus } from "lucide-react";
// constants
import { MAX_FILE_SIZE } from "@/constants/common";
// helper
import { generateFileName } from "@/helpers/attachment.helper";
// hooks
import { useInstance } from "@/hooks/store";

import { useAttachmentOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
};

export const IssueAttachmentActionButton: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, customButton, disabled = false } = props;
  // helper
  const [isLoading, setIsLoading] = useState(false);
  const { config } = useInstance();
  const handleAttachmentOperations = useAttachmentOperations(workspaceSlug, projectId, issueId);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const currentFile: File = acceptedFiles[0];
      if (!currentFile || !workspaceSlug) return;

      const uploadedFile: File = new File([currentFile], generateFileName(currentFile.name), {
        type: currentFile.type,
      });
      const formData = new FormData();
      formData.append("asset", uploadedFile);
      formData.append(
        "attributes",
        JSON.stringify({
          name: uploadedFile.name,
          size: uploadedFile.size,
        })
      );
      setIsLoading(true);
      handleAttachmentOperations.create(formData).finally(() => setIsLoading(false));
    },
    [handleAttachmentOperations, workspaceSlug]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: config?.file_size_limit ?? MAX_FILE_SIZE,
    multiple: false,
    disabled: isLoading || disabled,
  });

  return (
    <button {...getRootProps()} type="button" disabled={disabled}>
      <input {...getInputProps()} />
      {customButton ? customButton : <Plus className="h-4 w-4" />}
    </button>
  );
});
