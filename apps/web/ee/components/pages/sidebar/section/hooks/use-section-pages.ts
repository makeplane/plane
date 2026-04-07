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

import { useCallback } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import type { TPageNavigationTabs } from "@plane/types";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

/**
 * Hook for fetching pages by section type with pagination support
 * @param sectionType Type of the section (public, private, archived, shared)
 * @returns Object containing loading state, pagination info, and fetchNextPage function
 */
export const useSectionPages = (sectionType: TPageNavigationTabs, enabled = true) => {
  const { workspaceSlug } = useParams();
  const { fetchPagesByType, getPaginationInfo, getPaginationLoader } = usePageStore(EPageStoreType.WORKSPACE);

  const { isLoading } = useSWR(
    workspaceSlug && enabled ? `WORKSPACE_PAGES_${workspaceSlug}_${sectionType}` : null,
    workspaceSlug && enabled ? () => fetchPagesByType(sectionType) : null,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
    }
  );

  // Get pagination info for this section
  const paginationInfo = getPaginationInfo(sectionType);
  const paginationLoader = getPaginationLoader(sectionType);

  // Function to fetch next page
  const fetchNextPage = useCallback(() => {
    if (!workspaceSlug || !paginationInfo.hasNextPage || paginationLoader === "pagination") {
      return;
    }
    // Use fetchPagesByType directly with the cursor from pagination info
    fetchPagesByType(sectionType, undefined, paginationInfo.nextCursor ?? undefined);
  }, [
    workspaceSlug,
    paginationInfo.hasNextPage,
    paginationInfo.nextCursor,
    paginationLoader,
    fetchPagesByType,
    sectionType,
  ]);

  return {
    isLoading,
    hasNextPage: paginationInfo.hasNextPage,
    isFetchingNextPage: paginationLoader === "pagination",
    fetchNextPage,
  };
};
