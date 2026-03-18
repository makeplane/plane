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

const BITBUCKET_SYNC_METADATA_LINE = "_Synced from Plane_";
const BITBUCKET_SYNC_MARKER_PREFIX = "[plane-comment-id]:";

export const BITBUCKET_TO_PLANE_COMMENT_CACHE_KEY = (commentId: string) => `silo:comment:bb:${commentId}`;

export const PLANE_TO_BITBUCKET_COMMENT_CACHE_KEY = (commentId: string) => `silo:comment:plane:${commentId}`;

export const createBitbucketSyncCommentMarker = (planeCommentId: string): string =>
  `${BITBUCKET_SYNC_MARKER_PREFIX}${planeCommentId}`;

export const extractBitbucketSyncCommentMarker = (commentBody: string): string | null => {
  const markerLine = commentBody.split(/\r?\n/).find((line) => line.trim().startsWith(BITBUCKET_SYNC_MARKER_PREFIX));

  if (!markerLine) {
    return null;
  }

  return markerLine.replace(BITBUCKET_SYNC_MARKER_PREFIX, "").trim();
};

export const hasBitbucketSyncCommentMarker = (commentBody: string): boolean =>
  extractBitbucketSyncCommentMarker(commentBody) !== null;

export const removeBitbucketSyncCommentMarker = (commentBody: string): string =>
  commentBody
    .split(/\r?\n/)
    .filter((line) => {
      const trimmedLine = line.trim();
      return !trimmedLine.startsWith(BITBUCKET_SYNC_MARKER_PREFIX) && trimmedLine !== BITBUCKET_SYNC_METADATA_LINE;
    })
    .join("\n")
    .trim();

export const buildBitbucketSyncComment = (markdownBody: string, planeCommentId: string): string => {
  const normalizedBody = markdownBody.trim();
  const marker = createBitbucketSyncCommentMarker(planeCommentId);

  if (!normalizedBody) {
    return `${BITBUCKET_SYNC_METADATA_LINE}\n${marker}`;
  }

  return `${normalizedBody}\n\n---\n${BITBUCKET_SYNC_METADATA_LINE}\n${marker}`;
};

export {
  extractBitbucketBaseUrlFromPullRequestUrl,
  extractBitbucketBaseUrlFromRepositoryUrl,
  parseBitbucketPullRequestLink,
} from "@plane/etl/bitbucket";
export type { BitbucketPullRequestLinkParts } from "@plane/etl/bitbucket";
