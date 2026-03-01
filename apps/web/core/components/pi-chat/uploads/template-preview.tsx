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

import { File } from "lucide-react";
import { CircularProgressIndicator } from "@plane/ui";
import { ImageToolbarRoot } from "@/components/common/image-toolbar";
import { useUploadStatus } from "@/components/common/image-toolbar/use-upload-status";
import type { TPiAttachment } from "@/types/pi-chat";

type Props = {
  attachment: TPiAttachment;
  isLoading?: boolean;
  loadingPercentage?: number;
  onRemove?: () => void;
};

function formatBytes(bytes: number | undefined | null): string {
  // Handle invalid input gracefully
  if (bytes === undefined || bytes === null || typeof bytes !== "number" || isNaN(bytes)) {
    return "Unknown size";
  }

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(2)} ${units[i]}`;
}

export function TemplatePreview(props: Props) {
  const { attachment, onRemove, isLoading = false, loadingPercentage } = props;
  const displayStatus = useUploadStatus(loadingPercentage ?? 0);
  return (
    <div className="relative group/upload-component flex gap-3 items-center bg-layer-1 rounded-lg p-2 min-w-[180px] h-[58px]">
      <div className="relative flex-shrink-0 rounded-md p-3 bg-layer-2">
        {isLoading ? (
          <CircularProgressIndicator size={20} strokeWidth={3} percentage={displayStatus ?? 0} />
        ) : (
          <File className="size-6 text-placeholder" />
        )}
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <h3 className="text-body-xs-medium text-secondary max-w-[150px] truncate">{attachment.filename}</h3>
        <p className="text-caption-sm-medium text-disabled">{formatBytes(attachment.file_size)}</p>
      </div>

      <ImageToolbarRoot
        downloadSrc={attachment.attachment_url}
        src={attachment.attachment_url}
        onRemove={onRemove}
        isFullScreenable={false}
      />
    </div>
  );
}
