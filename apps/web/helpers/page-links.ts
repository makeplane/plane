/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

const INTERNAL_PAGE_HREF_PATTERN = /^\/([^/]+)\/projects\/([^/]+)\/pages\/([^/]+)\/?$/;

export type TInternalPageHref = {
  workspaceSlug: string;
  projectId: string;
  pageId: string;
};

export const buildInternalPageHref = (workspaceSlug: string, projectId: string, pageId: string) =>
  `/${workspaceSlug}/projects/${projectId}/pages/${pageId}`;

export const parseInternalPageHref = (href: string): TInternalPageHref | null => {
  try {
    const pathname = href.startsWith("http") ? new URL(href).pathname : href;
    const match = pathname.match(INTERNAL_PAGE_HREF_PATTERN);
    if (!match) return null;

    return {
      workspaceSlug: match[1],
      projectId: match[2],
      pageId: match[3],
    };
  } catch {
    return null;
  }
};
