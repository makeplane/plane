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

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { Building2, Globe, ListFilter, Lock } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TPage, TLogoProps } from "@plane/types";
import { ECollectionAccess } from "@plane/types";
import { Table } from "@plane/ui";
import { calculateTotalFilters, getPageName, shouldFilterPage } from "@plane/utils";
import nameFilterDark from "@/app/assets/empty-state/wiki/name-filter-dark.svg?url";
import nameFilterLight from "@/app/assets/empty-state/wiki/name-filter-light.svg?url";
import { CollectionPageLoader } from "@/components/pages/loaders/collection-page-loader";
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { PageFiltersSelection } from "@/components/pages/list/filters";
import { PageAppliedFiltersList } from "@/components/pages/list/applied-filters";
import { useMember } from "@/hooks/store/use-member";
import useDebounce from "@/hooks/use-debounce";
import { useAppRouter } from "@/hooks/use-app-router";
import { EPageStoreType, useCollection, usePageStore } from "@/plane-web/hooks/store";
import {
  getPredefinedWikiCollection,
  PREDEFINED_WIKI_COLLECTION_TRANSLATION_KEYS,
  resolveWikiCollectionId,
} from "../collections";
import { CollectionPageRow, useCollectionPageColumns } from "./collection-page-columns";
import type { TCollectionPageRowData } from "./collection-page-columns";

export const CollectionPagesListLayoutRoot = observer(function CollectionPagesListLayoutRoot() {
  const { workspaceSlug, collectionId } = useParams();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const router = useAppRouter();
  const collectionStore = useCollection();
  const { t } = useTranslation();
  const pageStore = usePageStore(EPageStoreType.WORKSPACE);
  const { filters, updateFilters, clearAllFilters } = pageStore;
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const [loadingRowIds, setLoadingRowIds] = useState<Set<string>>(new Set());
  const [isLoadingFilteredPages, setIsLoadingFilteredPages] = useState(false);
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);
  const resolvedCollectionId = resolveWikiCollectionId(pathname, collectionId?.toString());
  const predefinedCollection = getPredefinedWikiCollection(resolvedCollectionId);
  const isGeneralCollection = resolvedCollectionId === "general";
  const resolvedNameFilterImage = resolvedTheme === "light" ? nameFilterLight : nameFilterDark;
  const isFiltersApplied = calculateTotalFilters(filters?.filters ?? {}) !== 0;

  const { isLoading: isLoadingCollections } = useSWR(
    workspaceSlug ? ["workspace-collections", workspaceSlug.toString()] : null,
    workspaceSlug ? () => collectionStore.fetchCollections(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  useEffect(() => {
    if (!workspaceSlug || !isGeneralCollection || isLoadingCollections || collectionStore.defaultCollectionId) return;

    router.replace(`/${workspaceSlug.toString()}/wiki`);
  }, [collectionStore.defaultCollectionId, isGeneralCollection, isLoadingCollections, router, workspaceSlug]);

  const actualCollectionId = useMemo(() => {
    if (!resolvedCollectionId) return undefined;
    return resolvedCollectionId === "general" ? collectionStore.defaultCollectionId : resolvedCollectionId;
  }, [collectionStore.defaultCollectionId, resolvedCollectionId]);

  useEffect(() => {
    if (isLoadingCollections || !workspaceSlug || !actualCollectionId || isGeneralCollection) return;

    if (!collectionStore.getCollectionById(actualCollectionId)) {
      router.replace(`/${workspaceSlug.toString()}/wiki`);
    }
  }, [actualCollectionId, collectionStore, isGeneralCollection, isLoadingCollections, router, workspaceSlug]);

  const shouldLoadCollectionPages =
    !!workspaceSlug &&
    !!actualCollectionId &&
    (isGeneralCollection || !!collectionStore.getCollectionById(actualCollectionId));

  const shouldLoadWorkspacePagesForPredefinedCollection = !!workspaceSlug && !!predefinedCollection;

  const { isLoading: isLoadingWorkspacePages } = useSWR(
    shouldLoadWorkspacePagesForPredefinedCollection
      ? ["workspace-pages-for-predefined-collection", workspaceSlug]
      : null,
    shouldLoadWorkspacePagesForPredefinedCollection ? () => pageStore.fetchAllPages() : null,
    { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const { isLoading } = useSWR(
    shouldLoadCollectionPages ? ["collection-pages", workspaceSlug.toString(), actualCollectionId] : null,
    shouldLoadCollectionPages && workspaceSlug && actualCollectionId
      ? () => collectionStore.fetchCollectionPages(workspaceSlug.toString(), actualCollectionId)
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  const hasLoadedCollectionPages = actualCollectionId
    ? collectionStore.isCollectionPagesLoaded(actualCollectionId)
    : false;

  useEffect(() => {
    if (
      !actualCollectionId ||
      !shouldLoadCollectionPages ||
      !hasLoadedCollectionPages ||
      (!debouncedSearchQuery && !isFiltersApplied)
    ) {
      setIsLoadingFilteredPages(false);
      return;
    }

    let isCancelled = false;
    setIsLoadingFilteredPages(true);

    void collectionStore.ensureCollectionPageDetailsLoaded(actualCollectionId, "all").finally(() => {
      if (isCancelled) return;
      setIsLoadingFilteredPages(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [
    actualCollectionId,
    collectionStore,
    debouncedSearchQuery,
    hasLoadedCollectionPages,
    isFiltersApplied,
    shouldLoadCollectionPages,
  ]);

  const collection =
    actualCollectionId && !isGeneralCollection
      ? collectionStore.getCollectionById(actualCollectionId)?.asJSON
      : undefined;
  const collectionLogoProps = collection?.logo_props as TLogoProps | undefined;
  const collectionName = predefinedCollection
    ? t(
        PREDEFINED_WIKI_COLLECTION_TRANSLATION_KEYS[
          resolvedCollectionId as keyof typeof PREDEFINED_WIKI_COLLECTION_TRANSLATION_KEYS
        ]
      )
    : collection?.name || t("wiki_collections.fallback_name");
  const expandedRowIds = actualCollectionId
    ? collectionStore.getCollectionExpandedRowIds(actualCollectionId)
    : new Set<string>();

  const canRemoveFromCollection = useCallback(
    (pageId: string) =>
      !!actualCollectionId &&
      !isGeneralCollection &&
      collectionStore.canCurrentUserRemovePageFromCollection(actualCollectionId, pageId),
    [actualCollectionId, collectionStore, isGeneralCollection]
  );

  const handleRemoveFromCollection = useCallback(
    async (pageId: string) => {
      if (!workspaceSlug || !actualCollectionId || isGeneralCollection) return;

      try {
        await collectionStore.removePageFromCollection(workspaceSlug.toString(), pageId, actualCollectionId);
      } catch (error) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error.label"),
          message:
            (error as { detail?: string; error?: string })?.detail ??
            (error as { error?: string })?.error ??
            t("wiki_collections.list.remove_error"),
        });
      }
    },
    [actualCollectionId, collectionStore, isGeneralCollection, t, workspaceSlug]
  );

  const expandRow = useCallback(
    async (pageId: string) => {
      if (!actualCollectionId) return;

      collectionStore.setCollectionRowExpanded(actualCollectionId, pageId);

      const page = pageStore.getPageById(pageId);
      if (!page || (page.sub_pages_count ?? 0) === 0) return;
      if ((page.subPageIds?.length ?? 0) > 0) return;

      setLoadingRowIds((previous) => new Set(previous).add(pageId));
      try {
        await page.fetchSubPages();
      } finally {
        setLoadingRowIds((previous) => {
          const next = new Set(previous);
          next.delete(pageId);
          return next;
        });
      }
    },
    [actualCollectionId, collectionStore, pageStore]
  );

  const handleToggleExpand = useCallback(
    (pageId: string) => {
      if (!actualCollectionId) return;

      if (collectionStore.isCollectionRowExpanded(actualCollectionId, pageId)) {
        collectionStore.toggleCollectionExpandedRow(actualCollectionId, pageId);
        return;
      }

      void expandRow(pageId);
    },
    [actualCollectionId, collectionStore, expandRow]
  );

  const handleMovePage = useCallback(
    async ({
      draggedPageId,
      targetPageId,
      position,
    }: {
      draggedPageId: string;
      targetPageId: string;
      position: "before" | "after" | "inside";
    }) => {
      if (!actualCollectionId) return;

      const draggedPage = pageStore.getPageById(draggedPageId);
      const targetPage = pageStore.getPageById(targetPageId);
      if (!draggedPage?.id || !targetPage?.id) return;

      const targetParentId = position === "inside" ? targetPage.id : null;
      if (targetParentId === draggedPage.id) return;

      if (targetParentId) {
        let currentParentId: string | null | undefined = targetParentId;

        while (currentParentId) {
          if (currentParentId === draggedPage.id) return;
          currentParentId = pageStore.getPageById(currentParentId)?.parent_id;
        }
      }

      try {
        await collectionStore.movePageWithCollectionContext({
          pageId: draggedPageId,
          targetCollectionId: actualCollectionId,
          targetParentId,
          ...(position !== "inside" ? { reorderTargetPageId: targetPage.id, reorderPosition: position } : {}),
        });

        if (position === "inside") {
          await expandRow(targetPageId);
        }
      } catch (error) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error.label"),
          message:
            (error as { detail?: string; error?: string })?.detail ??
            (error as { error?: string })?.error ??
            t("common.error_occurred"),
        });
      }
    },
    [actualCollectionId, collectionStore, expandRow, pageStore, t]
  );

  const rootPageIds = actualCollectionId
    ? collectionStore.getCollectionRootPageIds(actualCollectionId, {
        searchQuery: debouncedSearchQuery,
        filters: filters.filters,
      })
    : [];

  const { columns, getUserDetails } = useCollectionPageColumns({
    canRemoveFromCollection,
    onRemoveFromCollection: handleRemoveFromCollection,
  });

  const handleRemoveFilter = (key: keyof NonNullable<typeof filters.filters>, value: string | null) => {
    let newValues = filters.filters?.[key];

    if (key === "favorites") newValues = !!value;
    if (Array.isArray(newValues)) {
      newValues = value ? newValues.filter((val) => val !== value) : [];
    }

    updateFilters("filters", { [key]: newValues });
  };

  const normalizedSearchQuery = debouncedSearchQuery.trim().toLowerCase();

  if (isGeneralCollection && !isLoadingCollections && !collectionStore.defaultCollectionId) {
    return null;
  }

  const doesScopedTreeMatchFilters = (pageId: string): boolean => {
    if (!actualCollectionId) return false;

    const page = pageStore.getPageById(pageId);
    if (!page?.id) {
      return normalizedSearchQuery.length === 0 && !isFiltersApplied;
    }
    if (page.deleted_at || page.archived_at) return false;

    const matchesSelf =
      getPageName(page.name).toLowerCase().includes(normalizedSearchQuery) &&
      shouldFilterPage(page.asJSON as TPage, filters.filters);

    if (matchesSelf) return true;

    return collectionStore
      .getCollectionChildPageIds(pageId, actualCollectionId)
      .some((childPageId) => doesScopedTreeMatchFilters(childPageId));
  };

  const tableData: TCollectionPageRowData[] = [];

  const appendRows = (pageIds: string[], depth: number) => {
    if (!actualCollectionId) return;

    pageIds.forEach((pageId) => {
      const page = pageStore.getPageById(pageId);
      if (!page?.id || page.deleted_at || page.archived_at) return;

      const childPageIds = collectionStore
        .getCollectionChildPageIds(pageId, actualCollectionId)
        .filter((childPageId) => doesScopedTreeMatchFilters(childPageId));
      const isExpanded = expandedRowIds.has(pageId);
      const nestedPagesCount = childPageIds.length || (page.sub_pages_count ?? 0);

      tableData.push({
        page: {
          ...(page.asJSON as TPage),
          id: pageId,
          canCurrentUserAccessPage: page.canCurrentUserAccessPage,
        },
        ownerDetails: page.owned_by ? getUserDetails(page.owned_by) : undefined,
        canCurrentUserAccessPage: page.canCurrentUserAccessPage,
        nestedPagesCount,
        depth,
        hasChildren: nestedPagesCount > 0,
        isExpanded,
        isLoadingSubPages: loadingRowIds.has(pageId),
        onToggleExpand: () => handleToggleExpand(pageId),
        onMovePage: handleMovePage,
        collectionId: actualCollectionId,
      });

      if (isExpanded) {
        appendRows(childPageIds, depth + 1);
      }
    });
  };

  appendRows(rootPageIds, 0);

  if (!actualCollectionId || isLoading || isLoadingCollections || isLoadingFilteredPages || isLoadingWorkspacePages) {
    return <CollectionPageLoader />;
  }

  return (
    <div className="size-full overflow-y-scroll vertical-scrollbar scrollbar-sm px-24 py-[54px]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between pl-6">
          <div className="flex min-w-0 items-end gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {collectionLogoProps?.in_use ? (
                <span className="flex-shrink-0">
                  <Logo logo={collectionLogoProps} size={24} type="lucide" />
                </span>
              ) : isGeneralCollection ? (
                <div className="size-9 grid place-items-center rounded-lg bg-[#F0F0F0] flex-shrink-0">
                  <Building2 className="size-4 text-[#676C6F]" />
                </div>
              ) : null}
              <h1 className="truncate text-[28px] font-medium leading-[1.2] text-primary">{collectionName}</h1>
            </div>
            {collection && (
              <div className="pb-[6px] flex-shrink-0">
                <span className="flex h-5 items-center gap-1.5 rounded-md bg-[#EFF0F0] px-1.5 text-11 font-medium text-[#676C6F]">
                  {collection.access === ECollectionAccess.PRIVATE ? (
                    <>
                      <Lock className="size-3.5" />
                      <span>{t("wiki_collections.list.invite_only")}</span>
                    </>
                  ) : (
                    <>
                      <Globe className="size-3.5" />
                      <span>{t("common.access.public")}</span>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
          <FiltersDropdown
            menuButton={
              <span className="relative grid size-7 flex-shrink-0 cursor-pointer place-items-center rounded-md border border-subtle shadow-sm transition-colors hover:bg-layer-1-hover">
                <ListFilter className="size-3.5 text-secondary" />
                {isFiltersApplied && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-primary" />
                )}
              </span>
            }
            title={t("common.filters")}
            placement="bottom-end"
            isFiltersApplied={isFiltersApplied}
          >
            <PageFiltersSelection
              filters={filters}
              handleFiltersUpdate={updateFilters}
              memberIds={workspaceMemberIds ?? undefined}
            />
          </FiltersDropdown>
        </div>

        {isFiltersApplied && (
          <div className="w-full flex min-h-11 flex-wrap items-center gap-2 rounded-lg bg-layer-1 p-2">
            <FiltersDropdown
              menuButton={
                <span className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-subtle px-2.5 text-13 font-medium text-secondary transition-colors hover:bg-layer-1-hover">
                  <ListFilter className="size-3.5" />
                  {t("common.filters")}
                </span>
              }
              title={t("common.filters")}
              placement="bottom-start"
              isFiltersApplied={isFiltersApplied}
            >
              <PageFiltersSelection
                filters={filters}
                handleFiltersUpdate={updateFilters}
                memberIds={workspaceMemberIds ?? undefined}
              />
            </FiltersDropdown>
            <PageAppliedFiltersList
              appliedFilters={filters.filters ?? {}}
              handleClearAllFilters={clearAllFilters}
              handleRemoveFilter={handleRemoveFilter}
              alwaysAllowEditing
              tagClassName="min-h-7 h-7 py-0"
            />
          </div>
        )}

        {tableData.length === 0 && (debouncedSearchQuery || isFiltersApplied) ? (
          <div className="grid h-full w-full place-items-center">
            <div className="text-center">
              <img
                src={resolvedNameFilterImage}
                className="h-36 w-36 mx-auto sm:h-48 sm:w-48"
                alt={t("wiki_collections.list.no_matching_pages")}
              />
              <h5 className="mt-7 mb-1 text-18 font-medium">{t("wiki_collections.list.no_matching_pages")}</h5>
              <p className="text-14 text-placeholder">
                {debouncedSearchQuery.length > 0
                  ? t("wiki_collections.list.remove_search_criteria")
                  : t("wiki_collections.list.remove_filters")}
              </p>
            </div>
          </div>
        ) : tableData.length === 0 ? (
          <div className="rounded-xl border-[0.5px] border-subtle py-10">
            <EmptyStateCompact
              assetKey="page"
              title={t("wiki_collections.list.no_pages_title")}
              description={t("wiki_collections.list.no_pages_description")}
            />
          </div>
        ) : (
          <Table<TCollectionPageRowData>
            columns={columns}
            data={tableData}
            keyExtractor={(rowData) => rowData.page.id ?? ""}
            renderRow={({
              rowData,
              children,
              className,
            }: {
              rowData: TCollectionPageRowData;
              children: ReactNode;
              className: string;
            }) => (
              <CollectionPageRow rowData={rowData} className={className}>
                {children}
              </CollectionPageRow>
            )}
            tableClassName="overflow-visible"
            tHeadClassName="border-b border-subtle/60 divide-y-0"
            tHeadTrClassName="divide-x-0"
            thClassName="px-4 py-2 first:pl-6 text-left text-12 font-semibold text-tertiary"
            tBodyClassName="divide-y-0"
            tBodyTrClassName="group divide-x-0 transition-colors hover:bg-layer-transparent-hover"
            tdClassName="px-4 py-2 first:pl-6"
          />
        )}
      </div>
    </div>
  );
});
