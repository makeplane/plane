/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { getFileURL } from "@plane/utils";

// Mirrors FileAsset.asset_url for ISSUE_ATTACHMENT on the backend, letting us
// resolve the cover from its attachment id without fetching the attachment list.
const buildAttachmentUrl = (workspaceSlug: string, projectId: string, issueId: string, attachmentId: string) =>
  getFileURL(
    `/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/attachments/${attachmentId}/`
  ) ?? null;

export const useIssueCoverImage = (
  workspaceSlug: string | undefined,
  projectId: string | null | undefined,
  issueId: string,
  coverImageAttachmentId?: string | null
): string | null => {
  if (!workspaceSlug || !projectId || !issueId || !coverImageAttachmentId) return null;
  return buildAttachmentUrl(workspaceSlug, projectId, issueId, coverImageAttachmentId);
};
