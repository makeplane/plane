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
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "@plane/react-theme";
import useSWR from "swr";
import { EPageAccess } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TPage, TPageDragPayload, TPageNavigationTabs } from "@plane/types";
import { calculateTotalFilters, cn } from "@plane/utils";
import allFiltersDark from "@/app/assets/empty-state/wiki/all-filters-dark.svg?url";
import allFiltersLight from "@/app/assets/empty-state/wiki/all-filters-light.svg?url";
import nameFilterDark from "@/app/assets/empty-state/wiki/name-filter-dark.svg?url";
import nameFilterLight from "@/app/assets/empty-state/wiki/name-filter-light.svg?url";
import { PageHead } from "@/components/core/page-title";
import { PageLoader } from "@/components/pages/loaders/page-loader";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
import useDebounce from "@/hooks/use-debounce";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
import { useCollectionPageColumns } from "./collection-page-columns";
import type { TCollectionPageRowData } from "./collection-page-columns";

type Props = {
  pageType: TPageNavigationTabs;
};

const PAGE_TYPE_LABELS: Record<TPageNavigationTabs, string> = {
  public: "Public",
  private: "Private",
  archived: "Archived",
  shared: "Shared",
};

const PageTypeTableRow = observer(function PageTypeTableRow(props: {
  rowData: TCollectionPageRowData;
  columns: ReturnType<typeof useCollectionPageColumns>["columns"];
  pageType: TPageNavigationTabs;
}) {
  const { rowData, columns, pageType } = props;
  const rowRef = useRef<HTMLTableRowElement | null>(null);
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const { workspaceSlug } = useParams();
  const { getPageById, isNestedPagesEnabled, movePageInternally } = usePageStore(EPageStoreType.WORKSPACE);
  const page = getPageById(rowData.page.id);

  const clearExpandTimer = useCallback(() => {
    if (!expandTimerRef.current) return;
    clearTimeout(expandTimerRef.current);
    expandTimerRef.current = null;
  }, []);

  useEffect(() => {
    const element = rowRef.current;
    if (!element || !page?.id || !workspaceSlug) return;

    const initialData: TPageDragPayload = {
      id: page.id,
      parentId: page.parent_id ?? null,
    };

    return combine(
      draggable({
        element,
        dragHandle: element,
        getInitialData: () => initialData,
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
        canDrag: () =>
          page.canCurrentUserEditPage &&
          page.isContentEditable &&
          isNestedPagesEnabled(workspaceSlug.toString()) &&
          !page.archived_at &&
          (!page.is_shared || page.isCurrentUserOwner),
      }),
      dropTargetForElements({
        element,
        onDragEnter: () => {
          setIsDropping(true);
          if (!rowData.hasChildren || rowData.isExpanded) return;
          clearExpandTimer();
          expandTimerRef.current = setTimeout(() => {
            rowData.onToggleExpand();
          }, 1000);
        },
        onDragLeave: () => {
          setIsDropping(false);
          clearExpandTimer();
        },
        onDrop: ({ location, self, source }) => {
          setIsDropping(false);
          clearExpandTimer();

          if (location.current.dropTargets[0]?.element !== self.element || !page.id) return;

          const { id: droppedPageId } = source.data as TPageDragPayload;
          const droppedPageDetails = getPageById(droppedPageId);
          if (!droppedPageDetails) return;

          const updatePayload: Partial<TPage> = {
            parent_id: page.id,
          };

          let targetAccess: EPageAccess | undefined;
          if (pageType === "public") {
            targetAccess = EPageAccess.PUBLIC;
          } else if (pageType === "private") {
            targetAccess = EPageAccess.PRIVATE;
          }

          if (targetAccess !== undefined && droppedPageDetails.access !== targetAccess) {
            updatePayload.access = targetAccess;
            updatePayload.is_shared = false;
          }

          void movePageInternally(droppedPageId, updatePayload);
        },
        canDrop: ({ source }) => {
          if (
            pageType === "shared" ||
            pageType === "archived" ||
            !page.canCurrentUserEditPage ||
            !page.isContentEditable ||
            !isNestedPagesEnabled(workspaceSlug.toString()) ||
            page.archived_at
          ) {
            return false;
          }

          const { id: droppedPageId, parentId: droppedPageParentId } = source.data as TPageDragPayload;
          if (!droppedPageId) return false;

          const sourcePage = getPageById(droppedPageId);
          if (!sourcePage) return false;

          const isSamePage = droppedPageId === page.id;
          const isImmediateParent = droppedPageParentId === page.id;
          const isAnyLevelChild = page.parentPageIds.includes(droppedPageId);

          if (isSamePage || isImmediateParent || isAnyLevelChild) return false;

          return true;
        },
      })
    );
  }, [clearExpandTimer, getPageById, isNestedPagesEnabled, movePageInternally, page, pageType, rowData, workspaceSlug]);

  useEffect(
    () => () => {
      clearExpandTimer();
    },
    [clearExpandTimer]
  );

  if (!page) return null;

  return (
    <tr
      ref={rowRef}
      className={cn("group divide-x-0 transition-colors hover:bg-layer-transparent-hover", {
        "opacity-30": isDragging,
        "bg-accent-primary/10 hover:bg-accent-primary/10": isDropping,
      })}
    >
      {columns.map((column) => (
        <td key={`${column.key}-${rowData.page.id}`} className="px-4 py-2 first:pl-6">
          {column.tdRender(rowData)}
        </td>
      ))}
    </tr>
  );
});

export const PageTypePagesListLayoutRoot = observer(function PageTypePagesListLayoutRoot(props: Props) {
  const { pageType } = props;
  const { workspaceSlug } = useParams();
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [loadingRowIds, setLoadingRowIds] = useState<Set<string>>(new Set());
  const [isRootDropping, setIsRootDropping] = useState(false);
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const router = useAppRouter();
  const rootDropRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);
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
    getPageById,
    getPaginationInfo,
    getPaginationLoader,
    isNestedPagesEnabled,
    movePageInternally,
  } = pageStore;
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - Wiki - ${PAGE_TYPE_LABELS[pageType]}`
    : undefined;
  const resolvedAllFiltersImage = resolvedTheme === "light" ? allFiltersLight : allFiltersDark;
  const resolvedNameFilterImage = resolvedTheme === "light" ? nameFilterLight : nameFilterDark;
  const hasActiveFilters = calculateTotalFilters(filters?.filters ?? {}) !== 0;
  const paginationInfo = getPaginationInfo(pageType);
  const paginationLoader = getPaginationLoader(pageType);
  const hasNextPage = paginationInfo.hasNextPage;
  const isFetchingNextPage = paginationLoader === "pagination";

  const { isLoading } = useSWR(
    workspaceSlug ? `WORKSPACE_PAGES_${workspaceSlug}_${pageType}_${debouncedSearchQuery || ""}` : null,
    workspaceSlug ? () => fetchPagesByType(pageType, debouncedSearchQuery) : null,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
    }
  );

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
  }, [filteredArchivedPageIds, filteredPrivatePageIds, filteredPublicPageIds, filteredSharedPageIds, pageType]);

  const canCreatePage = workspaceSlug ? getCanCreatePage(workspaceSlug) : false;

  const fetchNextPage = useCallback(() => {
    if (!workspaceSlug || !hasNextPage || isFetchingNextPage) {
      return;
    }

    void fetchPagesByType(pageType, debouncedSearchQuery || undefined, paginationInfo.nextCursor ?? undefined);
  }, [
    debouncedSearchQuery,
    fetchPagesByType,
    hasNextPage,
    isFetchingNextPage,
    pageType,
    paginationInfo.nextCursor,
    workspaceSlug,
  ]);

  useIntersectionObserver(
    containerRef,
    isFetchingNextPage ? null : intersectionElement,
    fetchNextPage,
    "100% 0% 100% 0%"
  );

  const getDescendantPageIds = useCallback(
    (pageId: string): string[] => {
      const descendants: string[] = [];

      const collect = (currentPageId: string) => {
        const page = getPageById(currentPageId);
        if (!page) return;

        (page.subPageIds ?? []).forEach((subPageId) => {
          descendants.push(subPageId);
          collect(subPageId);
        });
      };

      collect(pageId);
      return descendants;
    },
    [getPageById]
  );

  const handleToggleExpand = useCallback(
    async (pageId: string) => {
      const page = getPageById(pageId);
      if (!page) return;

      if (expandedRowIds.includes(pageId)) {
        setExpandedRowIds((previous) => {
          const next = new Set(previous);
          getDescendantPageIds(pageId).forEach((descendantId) => {
            next.delete(descendantId);
          });
          next.delete(pageId);
          return Array.from(next);
        });
        return;
      }

      setExpandedRowIds((previous) => (previous.includes(pageId) ? previous : [...previous, pageId]));

      if ((page.sub_pages_count ?? 0) === 0 || (page.subPageIds?.length ?? 0) > 0) return;

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
    [expandedRowIds, getDescendantPageIds, getPageById]
  );

  const { columns, getUserDetails } = useCollectionPageColumns({
    canRemoveFromCollection: () => false,
    onRemoveFromCollection: () => undefined,
  });

  const tableData = useMemo(() => {
    const rows: TCollectionPageRowData[] = [];

    const appendRows = (currentPageIds: string[], depth: number) => {
      currentPageIds.forEach((pageId) => {
        const page = getPageById(pageId);
        if (!page?.id || page.deleted_at) return;
        if (pageType === "archived" ? !page.archived_at : !!page.archived_at) return;

        const childPageIds = (page.subPageIds ?? []).filter((subPageId) => {
          const subPage = getPageById(subPageId);
          if (!subPage?.id || subPage.deleted_at) return false;
          return pageType === "archived" ? !!subPage.archived_at : !subPage.archived_at;
        });
        const isExpanded = expandedRowIds.includes(pageId);
        const nestedPagesCount = childPageIds.length || (page.sub_pages_count ?? 0);

        rows.push({
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
          onToggleExpand: () => {
            void handleToggleExpand(pageId);
          },
        });

        if (isExpanded) {
          appendRows(childPageIds, depth + 1);
        }
      });
    };

    appendRows(pageIds, 0);
    return rows;
  }, [expandedRowIds, getPageById, getUserDetails, handleToggleExpand, loadingRowIds, pageIds, pageType]);

  useEffect(() => {
    const element = rootDropRef.current;
    if (!element || !workspaceSlug) return;

    return dropTargetForElements({
      element,
      onDragEnter: () => setIsRootDropping(true),
      onDragLeave: () => setIsRootDropping(false),
      onDrop: ({ location, source }) => {
        setIsRootDropping(false);

        if (location.current.dropTargets.length !== 1) return;

        const { id: droppedPageId } = source.data as TPageDragPayload;
        const droppedPageDetails = getPageById(droppedPageId);
        if (!droppedPageDetails) return;

        const updatePayload: Partial<TPage> = {
          parent_id: null,
        };

        let targetAccess: EPageAccess | undefined;
        if (pageType === "public") {
          targetAccess = EPageAccess.PUBLIC;
        } else if (pageType === "private") {
          targetAccess = EPageAccess.PRIVATE;
        }

        if (targetAccess !== undefined && droppedPageDetails.access !== targetAccess) {
          updatePayload.access = targetAccess;
          updatePayload.is_shared = false;
        }

        void movePageInternally(droppedPageId, updatePayload);
      },
      canDrop: ({ source }) => {
        if (pageType === "archived" || pageType === "shared") {
          return false;
        }

        const { id: droppedPageId } = source.data as TPageDragPayload;
        const sourcePage = getPageById(droppedPageId);
        if (!sourcePage) return false;

        return (
          sourcePage.canCurrentUserEditPage &&
          sourcePage.isContentEditable &&
          isNestedPagesEnabled(workspaceSlug.toString()) &&
          !sourcePage.archived_at &&
          (!sourcePage.is_shared || sourcePage.isCurrentUserOwner)
        );
      },
    });
  }, [getPageById, isNestedPagesEnabled, movePageInternally, pageType, workspaceSlug]);

  const handleCreatePage = async () => {
    setIsCreatingPage(true);
    const payload: Partial<TPage> = {
      access: pageType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC,
    };

    try {
      const res = await createPage(payload);
      if (res?.id) {
        router.push(`/${workspaceSlug}/wiki/${res.id}`);
      }
    } catch (err: unknown) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message:
          (err as { data?: { error?: string } } | undefined)?.data?.error ||
          "Page could not be created. Please try again.",
      });
    } finally {
      setIsCreatingPage(false);
    }
  };

  const noMatchingPages = pageIds.length === 0 && (!!debouncedSearchQuery || hasActiveFilters);

  if (isLoading) {
    return (
      <>
        <PageHead title={pageTitle} />
        <PageLoader />
      </>
    );
  }

  if (noMatchingPages) {
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="grid h-full w-full place-items-center">
          <div className="text-center">
            <img
              src={debouncedSearchQuery.length > 0 ? resolvedNameFilterImage : resolvedAllFiltersImage}
              className="mx-auto h-36 w-36 sm:h-48 sm:w-48"
              alt={t("wiki_collections.list.no_matching_pages")}
            />
            <h5 className="mb-1 mt-7 text-18 font-medium">{t("wiki_collections.list.no_matching_pages")}</h5>
            <p className="text-14 text-placeholder">
              {debouncedSearchQuery.length > 0
                ? t("wiki_collections.list.remove_search_criteria")
                : t("wiki_collections.list.remove_filters")}
            </p>
          </div>
        </div>
      </>
    );
  }

  if (pageIds.length === 0) {
    if (pageType === "public") {
      return (
        <>
          <PageHead title={pageTitle} />
          <EmptyStateDetailed
            assetKey="page"
            title={t("workspace_pages.empty_state.public.title")}
            description={t("workspace_pages.empty_state.public.description")}
            actions={[
              {
                label: isCreatingPage
                  ? t("common.creating")
                  : t("workspace_pages.empty_state.public.primary_button.text"),
                onClick: () => {
                  void handleCreatePage();
                },
                disabled: !canCreatePage || isCreatingPage,
                variant: "primary",
              },
            ]}
          />
        </>
      );
    }

    if (pageType === "private") {
      return (
        <>
          <PageHead title={pageTitle} />
          <EmptyStateDetailed
            assetKey="page"
            title={t("workspace_pages.empty_state.private.title")}
            description={t("workspace_pages.empty_state.private.description")}
            actions={[
              {
                label: isCreatingPage
                  ? t("common.creating")
                  : t("workspace_pages.empty_state.private.primary_button.text"),
                onClick: () => {
                  void handleCreatePage();
                },
                disabled: !canCreatePage || isCreatingPage,
                variant: "primary",
              },
            ]}
          />
        </>
      );
    }

    if (pageType === "archived") {
      return (
        <>
          <PageHead title={pageTitle} />
          <EmptyStateDetailed
            assetKey="page"
            title={t("workspace_pages.empty_state.archived.title")}
            description={t("workspace_pages.empty_state.archived.description")}
          />
        </>
      );
    }

    return (
      <>
        <PageHead title={pageTitle} />
        <EmptyStateDetailed
          assetKey="page"
          title={t("workspace_pages.empty_state.general.title")}
          description={t("workspace_pages.empty_state.general.description")}
          actions={[
            {
              label: isCreatingPage
                ? t("common.creating")
                : t("workspace_pages.empty_state.general.primary_button.text"),
              onClick: () => {
                void handleCreatePage();
              },
              disabled: !canCreatePage || isCreatingPage,
              variant: "primary",
            },
          ]}
        />
      </>
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <div
        ref={rootDropRef}
        className={cn("size-full overflow-y-scroll vertical-scrollbar scrollbar-sm px-24 py-[54px]", {
          "bg-layer-1": isRootDropping,
        })}
      >
        <div ref={containerRef} className="flex flex-col gap-3">
          <table className="table-auto w-full overflow-hidden whitespace-nowrap">
            <thead className="border-b border-subtle/60 divide-y-0">
              <tr className="divide-x-0">
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-2 text-left text-12 font-semibold text-tertiary first:pl-6">
                    {(column.thRender && column.thRender()) || column.content}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-0">
              {tableData.map((rowData) => (
                <PageTypeTableRow key={rowData.page.id} rowData={rowData} columns={columns} pageType={pageType} />
              ))}
            </tbody>
          </table>
          {hasNextPage ? <div ref={setIntersectionElement} className="h-1 w-full" /> : null}
        </div>
      </div>
    </>
  );
});
