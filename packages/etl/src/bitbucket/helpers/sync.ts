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

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractBitbucketBaseUrl = (resourceUrl: string, pathPattern: RegExp): string | undefined => {
  if (!resourceUrl) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(resourceUrl);
    const pathMatch = parsedUrl.pathname.match(pathPattern);
    if (!pathMatch) {
      return undefined;
    }

    const basePath = (pathMatch[1] || "").replace(/\/+$/, "");
    return `${parsedUrl.origin}${basePath}`;
  } catch {
    return undefined;
  }
};

export const extractBitbucketBaseUrlFromPullRequestUrl = (pullRequestUrl: string): string | undefined =>
  extractBitbucketBaseUrl(pullRequestUrl, /^(.*)\/projects\/[^/]+\/repos\/[^/]+\/pull-requests\/\d+(?:\/.*)?$/i);

export const extractBitbucketBaseUrlFromRepositoryUrl = (repositoryUrl: string): string | undefined =>
  extractBitbucketBaseUrl(repositoryUrl, /^(.*)\/projects\/[^/]+\/repos\/[^/]+(?:\/.*)?$/i);

export type BitbucketPullRequestLinkParts = {
  projectKey: string;
  repoSlug: string;
  pullRequestId: string;
};

export const parseBitbucketPullRequestLink = (
  linkUrl: string,
  baseUrl: string
): BitbucketPullRequestLinkParts | null => {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
  if (!normalizedBaseUrl) {
    return null;
  }

  const escapedBaseUrl = escapeRegExp(normalizedBaseUrl);
  const pullRequestRegex = new RegExp(
    `^${escapedBaseUrl}/projects/([^/]+)/repos/([^/]+)/pull-requests/(\\d+)(?:/.*)?(?:\\?.*)?$`,
    "i"
  );

  const matches = linkUrl.match(pullRequestRegex);
  if (!matches) {
    return null;
  }

  return {
    projectKey: decodeURIComponent(matches[1]),
    repoSlug: decodeURIComponent(matches[2]),
    pullRequestId: matches[3],
  };
};
