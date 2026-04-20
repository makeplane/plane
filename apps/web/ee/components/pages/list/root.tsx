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

import { useCallback, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane imports
import { EPageAccess } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Loader } from "@plane/ui";
import type { TPage, TPageNavigationTabs } from "@plane/types";
import allFiltersDark from "@/app/assets/empty-state/wiki/all-filters-dark.svg?url";
import allFiltersLight from "@/app/assets/empty-state/wiki/all-filters-light.svg?url";
import nameFilterDark from "@/app/assets/empty-state/wiki/name-filter-dark.svg?url";
import nameFilterLight from "@/app/assets/empty-state/wiki/name-filter-light.svg?url";
import { PageHead } from "@/components/core/page-title";
import { PageListBlockRoot } from "@/components/pages/list/block-root";
import { PageLoader } from "@/components/pages/loaders/page-loader";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
import useDebounce from "@/hooks/use-debounce";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

type Props = {
  pageType: TPageNavigationTabs;
};

const PAGE_TYPE_LABELS: Record<TPageNavigationTabs, string> = {
  public: "Public",
  private: "Private",
  archived: "Archived",
  shared: "Shared",
};

export const WikiPagesListLayoutRoot = observer(function WikiPagesListLayoutRoot(props: Props) {
  const { pageType } = props;
  const { workspaceSlug } = useParams();
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // theme hook
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const pageStore = usePageStore(EPageStoreType.WORKSPACE);
  const {
    filters,
    fetchPagesByType,
    filteredPublicPageIds,
    filteredArchivedPageIds,
    filteredPrivatePageIds,
    filteredSharedPageIds,
    createPage,
    getCanCreatePage,
    getPaginationInfo,
    getPaginationLoader,
  } = pageStore;
  // params
  const router = useAppRouter();
  // Debounce the search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);
  // derived values
  const resolvedAllFiltersImage = resolvedTheme === "light" ? allFiltersLight : allFiltersDark;
  const resolvedNameFilterImage = resolvedTheme === "light" ? nameFilterLight : nameFilterDark;
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace?.name} - Wiki - ${PAGE_TYPE_LABELS[pageType]}`
    : undefined;
  // pagination hooks
  const paginationInfo = getPaginationInfo(pageType);
  const paginationLoader = getPaginationLoader(pageType);
  const hasNextPage = paginationInfo.hasNextPage;
  const isFetchingNextPage = paginationLoader === "pagination";
  // state for intersection observer element
  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);
  // ref for container
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Use SWR to fetch the data but not for rendering
  const { isLoading, data } = useSWR(
    workspaceSlug ? `WORKSPACE_PAGES_${workspaceSlug}_${pageType}_${debouncedSearchQuery || ""}` : null,
    workspaceSlug ? () => fetchPagesByType(pageType, debouncedSearchQuery) : null,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
    }
  );

  // Get the appropriate page IDs based on page type
  // Use filtered page IDs from store for all cases (including search queries)
  // so that paginated pages are included in the list
  const pageIds = useMemo(() => {
    switch (pageType) {
      case "public":
        return filteredPublicPageIds;
      case "private":
        return filteredPrivatePageIds;
      case "archived":
        return filteredArchivedPageIds;
      case "shared":
        return filteredSharedPageIds;
      default:
        return [];
    }
  }, [pageType, filteredPublicPageIds, filteredPrivatePageIds, filteredArchivedPageIds, filteredSharedPageIds]);

  // derived values
  const canCreatePage = workspaceSlug ? getCanCreatePage(workspaceSlug) : false;

  // Function to fetch next page
  const fetchNextPage = useCallback(() => {
    if (!workspaceSlug || !hasNextPage || isFetchingNextPage) {
      return;
    }
    // Use fetchPagesByType with the search query and cursor from pagination info
    fetchPagesByType(pageType, debouncedSearchQuery || undefined, paginationInfo.nextCursor ?? undefined);
  }, [
    workspaceSlug,
    hasNextPage,
    isFetchingNextPage,
    fetchPagesByType,
    pageType,
    debouncedSearchQuery,
    paginationInfo.nextCursor,
  ]);

  // Set up intersection observer to trigger loading more pages
  useIntersectionObserver(
    containerRef,
    isFetchingNextPage ? null : intersectionElement,
    fetchNextPage,
    `100% 0% 100% 0%`
  );

  if (isLoading)
    return (
      <>
        <PageHead title={pageTitle} />
        <PageLoader />
      </>
    );
  const handleCreatePage = async () => {
    setIsCreatingPage(true);
    const payload: Partial<TPage> = {
      access: pageType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC,
    };

    await createPage(payload)
      .then((res) => {
        if (res?.id) {
          const pageId = `/${workspaceSlug}/wiki/${res?.id}`;
          router.push(pageId);
        }
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
  // if no pages exist in the active page type
  if (!pageIds || pageIds.length === 0) {
    if (pageType === "public")
      return (
        <EmptyStateDetailed
          assetKey="page"
          title={t("workspace_pages.empty_state.public.title")}
          description={t("workspace_pages.empty_state.public.description")}
          actions={[
            {
              label: isCreatingPage
                ? t("common.creating")
                : t("workspace_pages.empty_state.public.primary_button.text"),
              onClick: handleCreatePage,
              disabled: !canCreatePage || isCreatingPage,
              variant: "primary",
            },
          ]}
        />
      );
    if (pageType === "private")
      return (
        <EmptyStateDetailed
          assetKey="page"
          title={t("workspace_pages.empty_state.private.title")}
          description={t("workspace_pages.empty_state.private.description")}
          actions={[
            {
              label: isCreatingPage
                ? t("common.creating")
                : t("workspace_pages.empty_state.private.primary_button.text"),
              onClick: handleCreatePage,
              disabled: !canCreatePage || isCreatingPage,
              variant: "primary",
            },
          ]}
        />
      );
    if (pageType === "archived")
      return (
        <EmptyStateDetailed
          assetKey="page"
          title={t("workspace_pages.empty_state.archived.title")}
          description={t("workspace_pages.empty_state.archived.description")}
        />
      );
    if (pageType === "shared")
      return (
        <EmptyStateDetailed
          assetKey="page"
          title="No shared pages"
          description="Pages shared with you will appear here when someone shares them."
        />
      );

    // General empty state when no pages are found
    return (
      <EmptyStateDetailed
        assetKey="page"
        title={t("workspace_pages.empty_state.general.title")}
        description={t("workspace_pages.empty_state.general.description")}
        actions={[
          {
            label: isCreatingPage ? t("common.creating") : t("workspace_pages.empty_state.general.primary_button.text"),
            onClick: handleCreatePage,
            disabled: !canCreatePage || isCreatingPage,
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
    <div ref={containerRef} className="size-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
      <PageHead title={pageTitle} />
      {pageIds.map((pageId) => (
        <PageListBlockRoot
          key={pageId}
          pageId={pageId}
          storeType={EPageStoreType.WORKSPACE}
          pageType={pageType}
          paddingLeft={0}
          sectionType={pageType}
        />
      ))}
      {hasNextPage && (
        <div ref={setIntersectionElement}>
          {isFetchingNextPage && (
            <Loader className="relative flex items-center gap-2 p-3 py-4 border-b border-subtle">
              <Loader.Item width={`${250 + 10 * Math.floor(Math.random() * 10)}px`} height="22px" />
              <div className="ml-auto relative flex items-center gap-2">
                <Loader.Item width="60px" height="22px" />
                <Loader.Item width="22px" height="22px" />
                <Loader.Item width="22px" height="22px" />
                <Loader.Item width="22px" height="22px" />
              </div>
            </Loader>
          )}
        </div>
      )}
    </div>
  );
});
