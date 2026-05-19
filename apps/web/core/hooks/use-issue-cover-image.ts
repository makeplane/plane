/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import type { TIssueAttachment, TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { getFileURL } from "@plane/utils";
import { IssueAttachmentService } from "@/services/issue";

const COVER_IMAGE_NAMES = ["cover-image.jpg", "cover-image.jpeg", "cover-image.png", "cover-image.webp", "cover.jpg", "cover.jpeg", "cover.png", "cover.webp"];

export const useIssueCoverImage = (
  workspaceSlug: string | undefined,
  projectId: string | null | undefined,
  issueId: string,
  attachmentCount: number,
  serviceType: TIssueServiceType = EIssueServiceType.ISSUES
) => {
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!workspaceSlug || !projectId || !issueId || attachmentCount === 0) {
      setCoverImageUrl(null);
      return;
    }

    let isMounted = true;
    const attachmentService = new IssueAttachmentService(serviceType);

    const fetchCoverImage = async () => {
      setIsLoading(true);
      try {
        const attachments = await attachmentService.getIssueAttachments(workspaceSlug, projectId, issueId);

        if (!isMounted) return;

        // Find attachment with cover image name
        const coverAttachment = attachments.find((attachment: TIssueAttachment) => {
          const fileName = attachment.attributes.name.toLowerCase();
          return COVER_IMAGE_NAMES.some(coverName => fileName === coverName);
        });

        if (coverAttachment) {
          const fileUrl = getFileURL(coverAttachment.asset_url);
          setCoverImageUrl(fileUrl ?? null);
        } else {
          setCoverImageUrl(null);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch cover image:", error);
          setCoverImageUrl(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCoverImage();

    return () => {
      isMounted = false;
    };
  }, [workspaceSlug, projectId, issueId, attachmentCount, serviceType]);

  return { coverImageUrl, isLoading };
};
