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

import { observer } from "mobx-react";
// ui
import { Tooltip } from "@plane/propel/tooltip";
import { CircularProgressIndicator } from "@plane/ui";
// components
import { getFileExtension } from "@plane/utils";
import { getFileIcon } from "@/components/icons";
// helpers
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import type { TAttachmentUploadStatus } from "@/store/work-items/details/attachment.store";

type Props = {
  uploadStatus: TAttachmentUploadStatus;
};

export const IssueAttachmentsUploadItem = observer(function IssueAttachmentsUploadItem(props: Props) {
  // props
  const { uploadStatus } = props;
  // derived values
  const fileName = uploadStatus.name;
  const fileExtension = getFileExtension(uploadStatus.name ?? "");
  const fileIcon = getFileIcon(fileExtension, 18);
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <div className="flex items-center justify-between gap-3 h-11 bg-surface-2 pl-9 pr-2 pointer-events-none">
      <div className="flex items-center gap-3 text-13 truncate">
        <div className="flex-shrink-0">{fileIcon}</div>
        <Tooltip tooltipContent={fileName} isMobile={isMobile}>
          <p className="text-secondary font-medium truncate">{fileName}</p>
        </Tooltip>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        <span className="flex-shrink-0">
          <CircularProgressIndicator size={20} strokeWidth={3} percentage={uploadStatus.progress} />
        </span>
        <div className="flex-shrink-0 text-13 font-medium">{uploadStatus.progress}% done</div>
      </div>
    </div>
  );
});
