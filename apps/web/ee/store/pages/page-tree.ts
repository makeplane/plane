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

type TLoadedPageTreeNode = {
  id?: string | null;
  subPageIds?: string[];
};

export const getLoadedSubtreePageIds = (
  pageId: string,
  getPageById: (pageId: string) => TLoadedPageTreeNode | undefined
): string[] => {
  const visitedPageIds = new Set<string>();
  const orderedPageIds: string[] = [];
  const pendingPageIds = [pageId];

  while (pendingPageIds.length > 0) {
    const currentPageId = pendingPageIds.shift();
    if (!currentPageId || visitedPageIds.has(currentPageId)) continue;

    const currentPage = getPageById(currentPageId);
    if (!currentPage?.id) continue;

    visitedPageIds.add(currentPageId);
    orderedPageIds.push(currentPageId);

    currentPage.subPageIds?.forEach((subPageId) => {
      if (!visitedPageIds.has(subPageId)) {
        pendingPageIds.push(subPageId);
      }
    });
  }

  return orderedPageIds;
};
