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

import type { TAttachmentPreviewItem } from "./attachment-preview.types";
import { AttachmentPreviewImage } from "./attachment-preview-image";
import { AttachmentPreviewVideo } from "./attachment-preview-video";
import { AttachmentPreviewAudio } from "./attachment-preview-audio";
import { AttachmentPreviewPdf } from "./attachment-preview-pdf";
import { AttachmentPreviewText } from "./attachment-preview-text";
import { AttachmentPreviewFallback } from "./attachment-preview-fallback";

export type AttachmentPreviewRendererProps = {
  item: TAttachmentPreviewItem;
};

export function AttachmentPreviewRenderer({ item }: AttachmentPreviewRendererProps) {
  const src = item.previewSrc ?? "";

  if (!item.previewSrc && item.kind !== "unsupported") {
    return <AttachmentPreviewFallback name={item.name} extension={item.extension} />;
  }

  switch (item.kind) {
    case "image":
      return <AttachmentPreviewImage src={src} alt={item.name} />;
    case "video":
      return <AttachmentPreviewVideo src={src} />;
    case "audio":
      return <AttachmentPreviewAudio src={src} name={item.name} />;
    case "pdf":
      return <AttachmentPreviewPdf src={src} downloadSrc={item.downloadSrc} name={item.name} />;
    case "text":
      return <AttachmentPreviewText src={src} size={item.size} />;
    case "unsupported":
    default:
      return <AttachmentPreviewFallback name={item.name} extension={item.extension} />;
  }
}
