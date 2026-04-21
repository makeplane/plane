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

import { useCallback, useMemo, useState } from "react";
import type { TAttachmentPreviewItem } from "@plane/blocks/common";
import type { TIssueAttachment } from "@plane/types";
import { toAttachmentPreviewItem } from "./attachment-preview-item";

type UseIssueAttachmentPreviewArgs = {
  attachmentIds: string[] | undefined;
  getAttachmentById: (id: string) => TIssueAttachment | undefined;
};

export function useIssueAttachmentPreview({ attachmentIds, getAttachmentById }: UseIssueAttachmentPreviewArgs) {
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);

  // Returns -1 if selected attachment was deleted, which disables nav and hides dialog via selectedItem
  const currentIndex = useMemo(() => {
    if (!selectedAttachmentId || !attachmentIds) return -1;
    return attachmentIds.indexOf(selectedAttachmentId);
  }, [selectedAttachmentId, attachmentIds]);

  const hasPrevious = currentIndex > 0;
  const hasNext = attachmentIds != null && currentIndex >= 0 && currentIndex < attachmentIds.length - 1;

  const openAttachmentPreview = useCallback((id: string) => {
    setSelectedAttachmentId(id);
  }, []);

  const closeAttachmentPreview = useCallback(() => {
    setSelectedAttachmentId(null);
  }, []);

  const goToNext = useCallback(() => {
    if (!attachmentIds || !hasNext) return;
    setSelectedAttachmentId(attachmentIds[currentIndex + 1]);
  }, [attachmentIds, currentIndex, hasNext]);

  const goToPrevious = useCallback(() => {
    if (!attachmentIds || !hasPrevious) return;
    setSelectedAttachmentId(attachmentIds[currentIndex - 1]);
  }, [attachmentIds, currentIndex, hasPrevious]);

  const selectedItem = useMemo<TAttachmentPreviewItem | null>(() => {
    if (!selectedAttachmentId) return null;
    const attachment = getAttachmentById(selectedAttachmentId);
    if (!attachment) return null;
    return toAttachmentPreviewItem(attachment);
  }, [selectedAttachmentId, getAttachmentById]);

  return {
    isPreviewOpen: selectedItem !== null,
    selectedItem,
    openAttachmentPreview,
    closeAttachmentPreview,
    goToNext,
    goToPrevious,
    hasNext,
    hasPrevious,
  };
}
