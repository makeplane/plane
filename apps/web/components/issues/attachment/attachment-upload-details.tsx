/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { CircularProgress } from "@makeplane/propel/components/circular-progress";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { getFileExtension } from "@plane/utils";
// ui
// icons
import { getFileIcon } from "@/components/icons";
// helpers
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import type { TAttachmentUploadStatus } from "@/store/issue/issue-details/attachment.store";

type Props = {
  uploadStatus: TAttachmentUploadStatus;
};

export const IssueAttachmentsUploadDetails = observer(function IssueAttachmentsUploadDetails(props: Props) {
  // props
  const { uploadStatus } = props;
  // derived values
  const fileName = uploadStatus.name;
  const fileExtension = getFileExtension(uploadStatus.name ?? "");
  const fileIcon = getFileIcon(fileExtension, 28);
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <div className="pointer-events-none flex h-[60px] items-center gap-3 rounded-lg border border-subtle-1 px-4 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="grid size-7 shrink-0 place-items-center">{fileIcon}</div>
        <div className="flex min-w-0 flex-col">
          <Tooltip label={fileName} layout="stacked" disabled={isMobile}>
            <span className="truncate text-body-xs-medium text-primary">{fileName}</span>
          </Tooltip>
          <span className="text-caption-sm-regular text-tertiary">
            {fileExtension.toUpperCase()} · {uploadStatus.progress}% done
          </span>
        </div>
      </div>
      <span className="shrink-0">
        <CircularProgress value={uploadStatus.progress} size="md" variant="brand" aria-label="Upload progress" />
      </span>
    </div>
  );
});
