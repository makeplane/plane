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

import type { TAttachmentPreviewItem } from "@plane/blocks/common";
import { getAttachmentPreviewKind } from "@plane/blocks/common";
import type { TIssueAttachment } from "@plane/types";
import { getFileExtension, getFileURL } from "@plane/utils";

/**
 * Map a persisted TIssueAttachment to the presentation-only TAttachmentPreviewItem
 * expected by the @plane/blocks AttachmentPreviewDialog.
 *
 * Uses the attachment's own `asset_url` directly (served by IssueAttachmentV2Endpoint)
 * rather than constructing URLs for the generic ProjectAssetEndpoint, which cannot
 * resolve issue-attachment FileAssets.
 */
export function toAttachmentPreviewItem(attachment: TIssueAttachment): TAttachmentPreviewItem {
  const extension = getFileExtension(attachment.attributes.name);
  const kind = getAttachmentPreviewKind(extension);

  const assetUrl = attachment.asset_url;
  const inlineSrc = getFileURL(assetUrl ? `${assetUrl}${assetUrl.includes("?") ? "&" : "?"}disposition=inline` : "");
  const downloadSrc = getFileURL(assetUrl ?? "");

  return {
    id: attachment.id,
    name: attachment.attributes.name,
    extension,
    size: attachment.attributes.size,
    kind,
    previewSrc: kind !== "unsupported" ? inlineSrc : undefined,
    downloadSrc: downloadSrc ?? "",
    openInNewTabSrc: inlineSrc,
  };
}
