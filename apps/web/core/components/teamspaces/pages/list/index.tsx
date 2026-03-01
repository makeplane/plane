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

import { useEffect, useMemo, useRef, useState } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane imports
import { EPageAccess } from "@plane/constants";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TPageNavigationTabs, TPage, TPageDragPayload } from "@plane/types";
// assets
import allFiltersDark from "@/app/assets/empty-state/wiki/all-filters-dark.svg?url";
import allFiltersLight from "@/app/assets/empty-state/wiki/all-filters-light.svg?url";
import archivedPageDark from "@/app/assets/empty-state/wiki/archived-dark.webp?url";
import archivedPageLight from "@/app/assets/empty-state/wiki/archived-light.webp?url";
import nameFilterDark from "@/app/assets/empty-state/wiki/name-filter-dark.svg?url";
import nameFilterLight from "@/app/assets/empty-state/wiki/name-filter-light.svg?url";
import publicPageDark from "@/app/assets/empty-state/wiki/public-dark.webp?url";
import publicPageLight from "@/app/assets/empty-state/wiki/public-light.webp?url";
// components
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { PageListBlockRoot } from "@/components/pages/list/block-root";
import { PageLoader } from "@/components/pages/loaders/page-loader";
// hooks
import useDebounce from "@/hooks/use-debounce";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

const storeType = EPageStoreType.TEAMSPACE;

type Props = {
  pageType: TPageNavigationTabs;
  workspaceSlug: string;
  teamspaceId: string;
};

export const TeamspacePagesListRoot = observer(function TeamspacePagesListRoot(props: Props) {
  const { pageType, workspaceSlug, teamspaceId } = props;

  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [isRootDropping, setIsRootDropping] = useState(false);

  // refs
  const rootDropRef = useRef<HTMLDivElement>(null);

  // router
  const router = useRouter();

  // theme hook
  const { resolvedTheme } = useTheme();

  // store hooks
  const {
    filters,
    fetchPagesByType,
    filteredPublicPageIds,
    filteredArchivedPageIds,
    createPage,
    movePageInternally,
    getPageById,
    isNestedPagesEnabled,
  } = usePageStore(storeType);

  // derived values
  const nameFilterResolvedPath = resolvedTheme === "light" ? nameFilterLight : nameFilterDark;
  const allFiltersResolvedPath = resolvedTheme === "light" ? allFiltersLight : allFiltersDark;
  const publicPageResolvedPath = resolvedTheme === "light" ? publicPageLight : publicPageDark;
  const archivedPageResolvedPath = resolvedTheme === "light" ? archivedPageLight : archivedPageDark;

  // Debounce the search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  // Use SWR to fetch the data
  const { isLoading, data } = useSWR(
    workspaceSlug && teamspaceId && pageType
      ? `TEAMSPACE_PAGES_${teamspaceId}_${pageType}_${debouncedSearchQuery || ""}`
      : null,
    workspaceSlug && teamspaceId && pageType
      ? () => fetchPagesByType(workspaceSlug, teamspaceId, pageType, debouncedSearchQuery)
      : null,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 2000,
    }
  );

  // Get the appropriate page IDs based on page type
  const pageIds = useMemo(() => {
    // If there's a search query, use the search results
    if (debouncedSearchQuery) {
      return (data?.map((page) => page.id).filter(Boolean) as string[]) || [];
    }
    switch (pageType) {
      case "public":
        return filteredPublicPageIds;
      case "archived":
        return filteredArchivedPageIds;
      default:
        return [];
    }
  }, [pageType, filteredPublicPageIds, filteredArchivedPageIds, data, debouncedSearchQuery]);

  // handle page create
  const handleCreatePage = async (pageAccess?: EPageAccess) => {
    setIsCreatingPage(true);

    const payload: Partial<TPage> = {
      access: pageAccess || EPageAccess.PUBLIC, // Always public for teamspaces
    };

    await createPage(payload)
      .then((res) => {
        const pageId = `/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${res?.id}`;
        router.push(pageId);
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.data?.error || "Page could not be created. Please try again.",
        });
      })
      .finally(() => setIsCreatingPage(false));
  };

  // Root level drop target
  useEffect(() => {
    const element = rootDropRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      onDragEnter: () => setIsRootDropping(true),
      onDragLeave: () => setIsRootDropping(false),
      onDrop: ({ location, source }) => {
        setIsRootDropping(false);

        // Only handle drops that are ONLY on the root container (not on individual pages)
        if (location.current.dropTargets.length !== 1) return;

        const { id: droppedPageId } = source.data as TPageDragPayload;
        const droppedPageDetails = getPageById(droppedPageId);
        if (!droppedPageDetails) return;

        // Move to root level (no parent)
        const updatePayload: { parent_id: string | null; access?: EPageAccess } = {
          parent_id: null,
        };

        movePageInternally(droppedPageId, updatePayload);
      },
      canDrop: ({ source }) => {
        // Don't allow drops if user doesn't have permissions or in archived section
        if (pageType === "archived") {
          return false;
        }

        const { id: droppedPageId } = source.data as TPageDragPayload;
        const sourcePage = getPageById(droppedPageId);
        if (!sourcePage) return false;

        return (
          sourcePage.canCurrentUserEditPage &&
          sourcePage.isContentEditable &&
          isNestedPagesEnabled(workspaceSlug) &&
          !sourcePage.archived_at &&
          sourcePage.isCurrentUserOwner
        );
      },
    });
  }, [pageType, getPageById, isNestedPagesEnabled, workspaceSlug, movePageInternally]);

  if (isLoading) return <PageLoader />;

  // Empty states
  if (pageIds.length === 0) {
    if (pageType === "public")
      return (
        <DetailedEmptyState
          title="No public pages yet"
          description="Create your first public page to get started"
          assetPath={publicPageResolvedPath}
          primaryButton={{
            text: isCreatingPage ? "Creating" : "Create public page",
            onClick: () => {
              handleCreatePage();
            },
            disabled: isCreatingPage,
          }}
        />
      );

    if (pageType === "archived")
      return (
        <DetailedEmptyState
          title="No archived pages"
          description="Pages you archive will appear here"
          assetPath={archivedPageResolvedPath}
        />
      );
  }

  // No matching filter results
  if (debouncedSearchQuery && pageIds.length === 0)
    return (
      <div className="h-full w-full grid place-items-center">
        <div className="text-center">
          <img
            src={debouncedSearchQuery.length > 0 ? nameFilterResolvedPath : allFiltersResolvedPath}
            className="h-36 sm:h-48 w-36 sm:w-48 mx-auto object-cover"
            alt="No matching pages"
          />
          <h5 className="text-h5-medium mt-7 mb-1">No matching pages</h5>
          <p className="text-placeholder text-body-sm-regular">
            {debouncedSearchQuery.length > 0
              ? "Remove the search criteria to see all pages"
              : "Remove the filters to see all pages"}
          </p>
        </div>
      </div>
    );

  return (
    <div
      ref={rootDropRef}
      className={`size-full overflow-y-scroll vertical-scrollbar scrollbar-sm ${isRootDropping ? "bg-layer-1" : ""}`}
    >
      {pageIds.map((pageId) => (
        <PageListBlockRoot
          key={pageId}
          pageId={pageId}
          storeType={storeType}
          pageType={pageType}
          paddingLeft={0}
          sectionType={pageType}
        />
      ))}
    </div>
  );
});
