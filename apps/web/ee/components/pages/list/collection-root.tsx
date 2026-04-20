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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
import { Globe, ListFilter, Lock } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Badge } from "@plane/propel/badge";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { IconButton } from "@plane/propel/icon-button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TLogoProps, TPage } from "@plane/types";
import { ECollectionAccess } from "@plane/types";
import { Table } from "@plane/ui";
import { calculateTotalFilters, cn } from "@plane/utils";
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { CollectionPageLoader, CollectionPageTableLoader } from "@/components/pages/loaders/collection-page-loader";
import { PageAppliedFiltersList } from "@/components/pages/list/applied-filters";
import { PageFiltersSelection } from "@/components/pages/list/filters";
import { useAppRouter } from "@/hooks/use-app-router";
import useDebounce from "@/hooks/use-debounce";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useMember } from "@/hooks/store/use-member";
import { EPageStoreType, useCollection, usePageStore } from "@/plane-web/hooks/store";
import {
  DEFAULT_WIKI_COLLECTION,
  DefaultWikiCollectionIcon,
  isPredefinedWikiCollection,
  PREDEFINED_WIKI_COLLECTION_TRANSLATION_KEYS,
  resolveWikiCollectionId,
} from "../collections";
import { COLLECTION_SWR_OPTIONS, collectionListKey, collectionPagesKey } from "../collection/swr";
import { getCollectionMoveTargetParentId, isCollectionMoveTargetWithinDraggedSubtree } from "./collection-dnd.helpers";
import { CollectionPageRow, useCollectionPageColumns } from "./collection-page-columns";
import type { TCollectionPageRowData } from "./collection-page-columns";

const getCollectionPageErrorMessage = (error: unknown, fallbackMessage: string) =>
  (error as { detail?: string; error?: string })?.detail ?? (error as { error?: string })?.error ?? fallbackMessage;

export const CollectionPagesListLayoutRoot = observer(function CollectionPagesListLayoutRoot() {
  const { workspaceSlug, collectionId } = useParams();
  const pathname = usePathname();
  const router = useAppRouter();
  const currentWorkspaceSlug = workspaceSlug?.toString();
  const collectionStore = useCollection();
  const { t } = useTranslation();
  const pageStore = usePageStore(EPageStoreType.WORKSPACE);
  const { filters, updateFilters, clearAllFilters } = pageStore;
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const [loadingRowIds, setLoadingRowIds] = useState<Set<string>>(new Set());
  const collectionFilters = filters.filters;
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);
  const hasSearchQuery = debouncedSearchQuery.trim().length > 0;
  const resolvedCollectionId = resolveWikiCollectionId(pathname, collectionId?.toString());
  const isGeneralCollection = resolvedCollectionId === DEFAULT_WIKI_COLLECTION.slug;
  const isFiltersApplied = calculateTotalFilters(filters?.filters ?? {}) !== 0;
  const isFilteredView = hasSearchQuery || isFiltersApplied;

  const { isLoading: isLoadingCollections } = useSWR(
    currentWorkspaceSlug ? collectionListKey(currentWorkspaceSlug) : null,
    currentWorkspaceSlug ? () => collectionStore.fetchCollections(currentWorkspaceSlug) : null,
    COLLECTION_SWR_OPTIONS
  );

  useEffect(() => {
    if (!currentWorkspaceSlug || !isGeneralCollection || isLoadingCollections || collectionStore.defaultCollectionId) {
      return;
    }

    router.replace(`/${currentWorkspaceSlug}/wiki`);
  }, [collectionStore.defaultCollectionId, currentWorkspaceSlug, isGeneralCollection, isLoadingCollections, router]);

  const actualCollectionId = useMemo(() => {
    if (!resolvedCollectionId) return undefined;
    return resolvedCollectionId === DEFAULT_WIKI_COLLECTION.slug
      ? collectionStore.defaultCollectionId
      : resolvedCollectionId;
  }, [collectionStore.defaultCollectionId, resolvedCollectionId]);

  useEffect(() => {
    if (isLoadingCollections || !currentWorkspaceSlug || !actualCollectionId || isGeneralCollection) return;

    if (!collectionStore.getCollectionById(actualCollectionId)) {
      router.replace(`/${currentWorkspaceSlug}/wiki`);
    }
  }, [actualCollectionId, collectionStore, currentWorkspaceSlug, isGeneralCollection, isLoadingCollections, router]);

  const collectionQueryOptions = useMemo(
    () => ({
      searchQuery: debouncedSearchQuery,
      filters: collectionFilters,
    }),
    [collectionFilters, debouncedSearchQuery]
  );
  const rootBranchOptions = useMemo(
    () => ({
      parentId: null,
      ...collectionQueryOptions,
    }),
    [collectionQueryOptions]
  );
  const shouldLoadCollectionPages =
    !!currentWorkspaceSlug &&
    !!actualCollectionId &&
    (isGeneralCollection || !!collectionStore.getCollectionById(actualCollectionId));

  const { isLoading } = useSWR(
    shouldLoadCollectionPages && currentWorkspaceSlug && actualCollectionId
      ? collectionPagesKey(currentWorkspaceSlug, actualCollectionId, debouncedSearchQuery, collectionFilters)
      : null,
    shouldLoadCollectionPages && currentWorkspaceSlug && actualCollectionId
      ? () =>
          collectionStore.fetchCollectionPages(currentWorkspaceSlug, actualCollectionId, {
            ...collectionQueryOptions,
          })
      : null,
    COLLECTION_SWR_OPTIONS
  );
  const rootBranchState = actualCollectionId
    ? collectionStore.getCollectionBranchState(actualCollectionId, rootBranchOptions)
    : undefined;
  const hasLoadedCollectionPages = !!rootBranchState?.isLoaded;
  const hasNextPage = !!rootBranchState?.hasNextPage;
  const isFetchingNextPage = !!rootBranchState?.isLoading && hasLoadedCollectionPages;
  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fetchNextPage = useCallback(() => {
    if (
      !currentWorkspaceSlug ||
      !actualCollectionId ||
      !rootBranchState?.nextCursor ||
      !hasNextPage ||
      isFetchingNextPage
    ) {
      return;
    }

    void collectionStore.fetchCollectionPages(currentWorkspaceSlug, actualCollectionId, {
      ...collectionQueryOptions,
      cursor: rootBranchState.nextCursor,
    });
  }, [
    actualCollectionId,
    collectionQueryOptions,
    collectionStore,
    currentWorkspaceSlug,
    hasNextPage,
    isFetchingNextPage,
    rootBranchState?.nextCursor,
  ]);

  useIntersectionObserver(
    containerRef,
    isFetchingNextPage ? null : intersectionElement,
    fetchNextPage,
    `100% 0% 100% 0%`
  );

  const collection =
    actualCollectionId && !isGeneralCollection
      ? collectionStore.getCollectionById(actualCollectionId)?.asJSON
      : undefined;
  const collectionLogoProps = collection?.logo_props as TLogoProps | undefined;
  const collectionIconBackground =
    collectionLogoProps?.in_use === "icon"
      ? (collectionLogoProps.icon?.background_color ?? collectionLogoProps.icon?.color)
      : undefined;
  const collectionName = isGeneralCollection
    ? DEFAULT_WIKI_COLLECTION.displayName
    : resolvedCollectionId && isPredefinedWikiCollection(resolvedCollectionId)
      ? t(PREDEFINED_WIKI_COLLECTION_TRANSLATION_KEYS[resolvedCollectionId])
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
      if (!currentWorkspaceSlug || !actualCollectionId || isGeneralCollection) return;

      try {
        await collectionStore.removePageFromCollection(currentWorkspaceSlug, pageId, actualCollectionId);
      } catch (error) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error.label"),
          message: getCollectionPageErrorMessage(error, t("wiki_collections.list.remove_error")),
        });
      }
    },
    [actualCollectionId, collectionStore, currentWorkspaceSlug, isGeneralCollection, t]
  );

  const expandRow = useCallback(
    async (pageId: string) => {
      if (!actualCollectionId || !currentWorkspaceSlug) return;

      collectionStore.setCollectionRowExpanded(actualCollectionId, pageId);

      const page = pageStore.getPageById(pageId);
      if (!page || (page.sub_pages_count ?? 0) === 0) return;
      const childBranchState = collectionStore.getCollectionBranchState(actualCollectionId, {
        parentId: pageId,
        ...collectionQueryOptions,
      });
      if (childBranchState?.isLoaded && !childBranchState.isStale) return;

      setLoadingRowIds((previous) => new Set(previous).add(pageId));
      try {
        await collectionStore.fetchCollectionBranchChildren(
          currentWorkspaceSlug,
          actualCollectionId,
          pageId,
          collectionQueryOptions
        );
      } finally {
        setLoadingRowIds((previous) => {
          const next = new Set(previous);
          next.delete(pageId);
          return next;
        });
      }
    },
    [actualCollectionId, collectionQueryOptions, collectionStore, currentWorkspaceSlug, pageStore]
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

      const targetParentId = getCollectionMoveTargetParentId(position, {
        id: targetPage.id,
        parent_id: targetPage.parent_id,
      });
      if (targetParentId === draggedPage.id) return;
      if (
        isCollectionMoveTargetWithinDraggedSubtree(
          draggedPage.id,
          targetParentId,
          (pageId) => pageStore.getPageById(pageId)?.parent_id
        )
      ) {
        return;
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
          message: getCollectionPageErrorMessage(error, t("common.error_occurred")),
        });
      }
    },
    [actualCollectionId, collectionStore, expandRow, pageStore, t]
  );

  const rootPageIds = actualCollectionId
    ? collectionStore.getCollectionRootPageIds(actualCollectionId, collectionQueryOptions)
    : [];

  const { columns, getUserDetails } = useCollectionPageColumns({
    canRemoveFromCollection,
    onRemoveFromCollection: handleRemoveFromCollection,
  });

  const handleRemoveFilter = useCallback(
    (key: keyof NonNullable<typeof collectionFilters>, value: string | null) => {
      let nextValues = collectionFilters?.[key];

      if (key === "favorites") nextValues = !!value;
      if (Array.isArray(nextValues)) {
        nextValues = value ? nextValues.filter((currentValue) => currentValue !== value) : [];
      }

      updateFilters("filters", { [key]: nextValues });
    },
    [collectionFilters, updateFilters]
  );

  const handleClearMatchingFilters = useCallback(() => {
    if (filters.searchQuery) {
      updateFilters("searchQuery", "");
    }

    if (isFiltersApplied) {
      clearAllFilters();
    }
  }, [clearAllFilters, filters.searchQuery, isFiltersApplied, updateFilters]);

  const tableData: TCollectionPageRowData[] = [];
  const showPagesLoader = isLoading && !hasLoadedCollectionPages;

  const appendRows = (pageIds: string[], depth: number) => {
    if (!actualCollectionId) return;

    pageIds.forEach((pageId) => {
      const page = pageStore.getPageById(pageId);
      if (!page?.id || page.deleted_at || page.archived_at) return;

      const childPageIds = collectionStore.getCollectionChildPageIds(
        pageId,
        actualCollectionId,
        collectionQueryOptions
      );
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
        onMovePage: isFilteredView ? undefined : handleMovePage,
        collectionId: actualCollectionId,
      });

      if (isExpanded) {
        appendRows(childPageIds, depth + 1);
      }
    });
  };

  appendRows(rootPageIds, 0);

  if (isGeneralCollection && !isLoadingCollections && !collectionStore.defaultCollectionId) {
    return null;
  }

  if (!actualCollectionId || isLoadingCollections) {
    return <CollectionPageLoader />;
  }

  return (
    <div ref={containerRef} className="@container size-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
      <div className="w-full max-w-250 mx-auto px-page-x py-9 @min-[65.2rem]:px-0">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {collectionLogoProps?.in_use ? (
                  <span
                    className={cn("grid size-9 shrink-0 place-items-center rounded-[10px]", {
                      "bg-layer-1": !collectionIconBackground,
                    })}
                    style={{ backgroundColor: collectionIconBackground ? `${collectionIconBackground}20` : undefined }}
                  >
                    <Logo logo={collectionLogoProps} size={24} type="lucide" />
                  </span>
                ) : isGeneralCollection ? (
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-label-grey-bg">
                    <DefaultWikiCollectionIcon className="size-8 text-label-grey-icon" />
                  </div>
                ) : null}
                <h1 className="truncate text-[28px] font-medium leading-[1.2] text-primary">{collectionName}</h1>
              </div>
              {collection && (
                <div className="shrink-0 pb-[6px]">
                  <Badge
                    size="base"
                    variant="neutral"
                    prependIcon={collection.access === ECollectionAccess.PRIVATE ? <Lock /> : <Globe />}
                  >
                    {collection.access === ECollectionAccess.PRIVATE
                      ? t("wiki_collections.list.invite_only")
                      : t("common.access.public")}
                  </Badge>
                </div>
              )}
            </div>
            <FiltersDropdown
              menuButton={
                <span className="relative shrink-0">
                  <IconButton variant="secondary" size="lg" icon={ListFilter} aria-label={t("common.filters")} />
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
                  <Button variant="secondary" size="lg" prependIcon={<ListFilter />}>
                    {t("common.filters")}
                  </Button>
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

          {showPagesLoader ? (
            <CollectionPageTableLoader />
          ) : tableData.length === 0 && isFilteredView ? (
            <div className="grid h-full min-h-88 w-full place-items-center rounded-xl border-[0.5px] border-subtle px-6 py-10">
              <EmptyStateCompact
                assetKey="page"
                align="center"
                title={t("wiki_collections.list.no_matching_pages")}
                description={
                  hasSearchQuery
                    ? t("wiki_collections.list.remove_search_criteria")
                    : t("wiki_collections.list.remove_filters")
                }
                actions={[
                  {
                    label: t("common.clear_all"),
                    variant: "secondary",
                    onClick: handleClearMatchingFilters,
                  },
                ]}
              />
            </div>
          ) : tableData.length === 0 ? (
            <div className="grid h-full w-full place-items-center rounded-xl border-[0.5px] border-subtle px-6 py-10">
              <EmptyStateCompact
                assetKey="page"
                title={t("wiki_collections.list.no_pages_title")}
                description={t("wiki_collections.list.no_pages_description")}
                align="center"
              />
            </div>
          ) : (
            <>
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
              {hasNextPage && <div ref={setIntersectionElement} className="h-6 w-full" />}
            </>
          )}
        </div>
      </div>
    </div>
  );
});
