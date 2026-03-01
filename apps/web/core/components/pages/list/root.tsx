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
import { EPageAccess, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EUserProjectRoles } from "@plane/types";
import type { TPage, TPageDragPayload, TPageNavigationTabs } from "@plane/types";
// components
import allFiltersDark from "@/app/assets/empty-state/wiki/all-filters-dark.svg?url";
import allFiltersLight from "@/app/assets/empty-state/wiki/all-filters-light.svg?url";
import nameFilterDark from "@/app/assets/empty-state/wiki/name-filter-dark.svg?url";
import nameFilterLight from "@/app/assets/empty-state/wiki/name-filter-light.svg?url";
import { PageListBlockRoot } from "@/components/pages/list/block-root";
import { PageLoader } from "@/components/pages/loaders/page-loader";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import useDebounce from "@/hooks/use-debounce";
// assets
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

const storeType = EPageStoreType.PROJECT;

type Props = {
  pageType: TPageNavigationTabs;
  workspaceSlug: string;
  projectId: string;
};

export const ProjectPagesListRoot = observer(function ProjectPagesListRoot(props: Props) {
  const { pageType, workspaceSlug, projectId } = props;
  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [isRootDropping, setIsRootDropping] = useState(false);
  // refs
  const rootDropRef = useRef<HTMLDivElement>(null);
  // router
  const router = useRouter();
  // theme hook
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();
  const {
    filters,
    fetchPagesByType,
    filteredPublicPageIds,
    filteredArchivedPageIds,
    filteredPrivatePageIds,
    createPage,
    movePageInternally,
    getPageById,
    isNestedPagesEnabled,
  } = usePageStore(storeType);
  // derived values
  const resolvedAllFiltersImage = resolvedTheme === "light" ? allFiltersLight : allFiltersDark;
  const resolvedNameFilterImage = resolvedTheme === "light" ? nameFilterLight : nameFilterDark;

  // Debounce the search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  // Use SWR to fetch the data but not for rendering
  const { isLoading, data } = useSWR(
    workspaceSlug && projectId && pageType
      ? `PROJECT_PAGES_${projectId}_${pageType}_${debouncedSearchQuery || ""}`
      : null,
    workspaceSlug && projectId && pageType
      ? () => fetchPagesByType(workspaceSlug, projectId, pageType, debouncedSearchQuery)
      : null,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 2000, // Disable deduping to ensure fresh requests
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
      case "private":
        return filteredPrivatePageIds;
      case "archived":
        return filteredArchivedPageIds;
      default:
        return [];
    }
  }, [pageType, filteredPublicPageIds, filteredPrivatePageIds, filteredArchivedPageIds, data, debouncedSearchQuery]);

  // derived values - memoized for performance
  const hasProjectMemberLevelPermissions = useMemo(
    () => allowPermissions([EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER], EUserPermissionsLevel.PROJECT),
    [allowPermissions]
  );

  // handle page create
  const handleCreatePage = async (pageAccess?: EPageAccess) => {
    setIsCreatingPage(true);

    const payload: Partial<TPage> = {
      access: pageAccess || (pageType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC),
    };

    await createPage(payload)
      .then((res) => {
        const pageId = `/${workspaceSlug}/projects/${currentProjectDetails?.id}/pages/${res?.id}`;
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

  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

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

        // Update access based on current section
        let targetAccess: EPageAccess | undefined;
        if (pageType === "public") {
          targetAccess = EPageAccess.PUBLIC;
        } else if (pageType === "private") {
          targetAccess = EPageAccess.PRIVATE;
        }

        if (targetAccess && droppedPageDetails.access !== targetAccess) {
          updatePayload.access = targetAccess;
        }

        movePageInternally(droppedPageId, updatePayload);
      },
      canDrop: ({ source }) => {
        // Don't allow drops if user doesn't have permissions or in archived section
        if (!hasProjectMemberLevelPermissions || pageType === "archived") {
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
          // For shared pages, only the owner can move them
          (!sourcePage.is_shared || sourcePage.isCurrentUserOwner)
        );
      },
    });
  }, [
    hasProjectMemberLevelPermissions,
    pageType,
    getPageById,
    isNestedPagesEnabled,
    workspaceSlug,
    movePageInternally,
  ]);

  if (isLoading) return <PageLoader />;

  // if no pages exist in the active page type
  if (pageIds.length === 0) {
    if (pageType === "public")
      return (
        <EmptyStateDetailed
          assetKey="page"
          title={t("project_page.empty_state.public.title")}
          description={t("project_page.empty_state.public.description")}
          actions={[
            {
              label: isCreatingPage ? t("creating") : t("project_page.empty_state.public.primary_button.text"),
              onClick: () => {
                handleCreatePage();
              },
              disabled: !canPerformEmptyStateActions || isCreatingPage,
              variant: "primary",
            },
          ]}
        />
      );
    if (pageType === "private")
      return (
        <EmptyStateDetailed
          assetKey="page"
          title={t("project_page.empty_state.private.title")}
          description={t("project_page.empty_state.private.description")}
          actions={[
            {
              label: isCreatingPage ? t("creating") : t("project_page.empty_state.private.primary_button.text"),
              onClick: () => {
                handleCreatePage();
              },
              disabled: !canPerformEmptyStateActions || isCreatingPage,
              variant: "primary",
            },
          ]}
        />
      );
    if (pageType === "archived")
      return (
        <EmptyStateDetailed
          assetKey="page"
          title={t("project_page.empty_state.archived.title")}
          description={t("project_page.empty_state.archived.description")}
        />
      );
    // General empty state when no pages are found
    return (
      <EmptyStateDetailed
        assetKey="page"
        title={t("project_page.empty_state.general.title")}
        description={t("project_page.empty_state.general.description")}
        actions={[
          {
            label: isCreatingPage ? t("creating") : t("project_page.empty_state.general.primary_button.text"),
            onClick: () => {
              handleCreatePage();
            },
            disabled: !hasProjectMemberLevelPermissions || isCreatingPage,
            variant: "primary",
          },
        ]}
      />
    );
  }

  // if no pages match the filter criteria
  if (debouncedSearchQuery && pageIds.length === 0)
    return (
      <div className="h-full w-full grid place-items-center">
        <div className="text-center">
          <img
            src={debouncedSearchQuery.length > 0 ? resolvedNameFilterImage : resolvedAllFiltersImage}
            className="h-36 sm:h-48 w-36 sm:w-48 mx-auto"
            alt="No matching pages"
          />
          <h5 className="text-18 font-medium mt-7 mb-1">No matching pages</h5>
          <p className="text-placeholder text-14">
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
