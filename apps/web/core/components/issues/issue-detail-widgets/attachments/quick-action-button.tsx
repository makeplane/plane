/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useCallback, useState } from "react";
import { observer } from "mobx-react";
import type { FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { PlusIcon } from "@plane/propel/icons";
// gizmo imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// gizmo web hooks
import { useFileSize } from "@/plane-web/hooks/use-file-size";
// local imports
import { useAttachmentOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssueAttachmentActionButton = observer(function IssueAttachmentActionButton(props: Props) {
  const { workspaceSlug, projectId, issueId, customButton, disabled = false, issueServiceType } = props;
  // state
  const [isLoading, setIsLoading] = useState(false);
  // store hooks
  const { setLastWidgetAction, fetchActivities } = useIssueDetail(issueServiceType);
  // file size
  const { maxFileSize } = useFileSize();
  // operations
  const { operations: attachmentOperations } = useAttachmentOperations(
    workspaceSlug,
    projectId,
    issueId,
    issueServiceType
  );
  // handlers
  const handleFetchPropertyActivities = useCallback(() => {
    fetchActivities(workspaceSlug, projectId, issueId);
  }, [fetchActivities, workspaceSlug, projectId, issueId]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const totalAttachedFiles = acceptedFiles.length + rejectedFiles.length;

      if (rejectedFiles.length === 0) {
        const currentFile: File = acceptedFiles[0];
        if (!currentFile || !workspaceSlug) return;

        setIsLoading(true);
        attachmentOperations
          .create(currentFile)
          .catch(() => {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Ошибка!",
              message: "Не удалось прикрепить файл. Попробуйте загрузить снова.",
            });
          })
          .finally(() => {
            handleFetchPropertyActivities();
            setLastWidgetAction("attachments");
            setIsLoading(false);
          });
        return;
      }

      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Ошибка!",
        message:
          totalAttachedFiles > 1
            ? "За один раз можно загрузить только один файл."
            : `Размер файла должен быть не более ${maxFileSize / 1024 / 1024} МБ.`,
      });
      return;
    },
    [attachmentOperations, maxFileSize, workspaceSlug, handleFetchPropertyActivities, setLastWidgetAction]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    multiple: false,
    disabled: isLoading || disabled,
  });

  return (
    <div
      onClick={(e) => {
        // TODO: Remove extra div and move event propagation to button
        e.stopPropagation();
      }}
    >
      <button {...getRootProps()} type="button" disabled={disabled}>
        <input {...getInputProps()} />
        {customButton ? customButton : <PlusIcon className="h-4 w-4" />}
      </button>
    </div>
  );
});
