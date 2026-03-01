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

import { useEffect, useState } from "react";
import { CircularProgressIndicator } from "@plane/ui";
import { cn } from "@plane/utils";
import { ImageToolbarRoot } from "@/components/common/image-toolbar";
import { useUploadStatus } from "@/components/common/image-toolbar/use-upload-status";
import type { TPiAttachment } from "@/types/pi-chat";

type Props = {
  attachment: TPiAttachment;
  isLoading?: boolean;
  loadingPercentage?: number;
  onRemove?: () => void;
};
export function ImagePreview(props: Props) {
  const { attachment, onRemove, isLoading = false, loadingPercentage } = props;
  const [scaledWidth, setScaledWidth] = useState<number | null>(null);
  const [meta, setMeta] = useState<{ width: number; height: number | null; aspect_ratio: number | null } | null>(null);
  // hooks
  const displayStatus = useUploadStatus(loadingPercentage ?? 0);

  function getScaledWidthFromSrc(src: string, targetHeight = 58): Promise<number> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        resolve(ratio * targetHeight);
        setMeta({ width: img.naturalWidth, height: img.naturalHeight, aspect_ratio: ratio });
      };
      img.onerror = reject;
      img.src = src;
    });
  }
  useEffect(() => {
    getScaledWidthFromSrc(attachment.attachment_url, 58)
      .then((w) => {
        setScaledWidth(w);
        return;
      })
      .catch(() => setScaledWidth(58));
  }, [attachment.attachment_url]);
  return (
    attachment && (
      <div className="relative flex gap-3 items-center group rounded-lg group/upload-component">
        {isLoading && (
          <div
            className="animate-pulse bg-layer-1 rounded-md flex items-center justify-center"
            style={{ width: scaledWidth ?? 58, height: 58 }}
          >
            <CircularProgressIndicator size={20} strokeWidth={3} percentage={displayStatus ?? 0} />
          </div>
        )}
        <img
          src={attachment.attachment_url}
          alt={attachment.filename}
          width={58}
          height={58}
          className={cn(
            "rounded-lg border-1 border-subtle-1 w-auto h-[58px] transition-all duration-500 ease-in-out opacity-100",
            {
              hidden: isLoading,
              "blur-sm opacity-80 loading-image": isLoading,
            }
          )}
        />

        <ImageToolbarRoot
          aspectRatio={!meta?.aspect_ratio ? 1 : meta.aspect_ratio}
          downloadSrc={attachment.attachment_url}
          height={meta?.height?.toString() ?? "auto"}
          width={meta?.width?.toString() ?? "35%"}
          src={attachment.attachment_url}
          onRemove={onRemove}
          isFullScreenable
        />
      </div>
    )
  );
}
