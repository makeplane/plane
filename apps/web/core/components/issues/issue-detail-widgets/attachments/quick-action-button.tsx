/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import { PlusIcon } from "@plane/propel/icons";
// plane imports
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web hooks
import { useFileSize } from "@/hooks/use-file-size";
// local imports
import { useAttachmentDropHandler, useAttachmentOperations } from "./helper";

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
  const handleUploadSettled = useCallback(() => {
    fetchActivities(workspaceSlug, projectId, issueId);
    setLastWidgetAction("attachments");
  }, [fetchActivities, workspaceSlug, projectId, issueId, setLastWidgetAction]);

  const { onDrop, isUploading } = useAttachmentDropHandler({
    create: attachmentOperations.create,
    maxFileSize,
    onUploadSettled: handleUploadSettled,
  });

  // react-dropzone does not forward its disabled state to the root element, so the native
  // button has to be given the same condition or it stays clickable while doing nothing.
  const isDropzoneDisabled = isUploading || disabled || !workspaceSlug;

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    multiple: true,
    disabled: isDropzoneDisabled,
  });

  return (
    // Presentational wrapper: the button below is the real control, this only keeps the
    // click from bubbling to the surrounding work item row.
    // TODO: Remove extra div and move event propagation to button
    <div
      role="presentation"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <button {...getRootProps()} type="button" disabled={isDropzoneDisabled}>
        <input {...getInputProps()} />
        {customButton ? customButton : <PlusIcon className="h-4 w-4" />}
      </button>
    </div>
  );
});
