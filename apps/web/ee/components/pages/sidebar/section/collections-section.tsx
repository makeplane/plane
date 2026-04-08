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

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
import { Building2, ChevronRight, Loader } from "lucide-react";
import { PlusIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { EPageAccess } from "@plane/types";
import type { TPageDragPayload } from "@plane/types";
import { cn } from "@plane/utils";
import { CreateCollectionModal } from "@/components/collections";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { EPageStoreType, useCollection, usePageStore } from "@/plane-web/hooks/store";
import { AddExistingPageModal } from "./add-existing-page-modal";
import { CollectionAddPageMenu } from "./collection-add-page-menu";
import { CollectionItem } from "./collection-item";
import { WikiPageSidebarListItemRoot } from "../list-item-root";

const collectionsListKey = (workspaceSlug: string) => ["workspace-collections", workspaceSlug] as const;
const SIDEBAR_ROW_CLASS =
  "group flex w-full items-center justify-between gap-1 rounded-md py-1.5 text-secondary transition-colors hover:bg-layer-transparent-hover focus-within:bg-layer-transparent-active";
const SIDEBAR_ROW_CONTENT_CLASS = "flex w-full items-center gap-1 truncate px-1";

const GeneralCollectionItem = observer(function GeneralCollectionItem({
  workspaceSlug,
  isActive,
  isMembershipsLoading,
  onOpenAddExistingPage,
}: {
  workspaceSlug: string;
  isActive: boolean;
  isMembershipsLoading: boolean;
  onOpenAddExistingPage: (collectionId: string) => void;
}) {
  const router = useAppRouter();
  const { pageId: currentPageIdParam } = useParams();
  const collectionStore = useCollection();
  const pageStore = usePageStore(EPageStoreType.WORKSPACE);
  const [isHovering, setIsHovering] = useState(false);
  const [isPageDropTarget, setIsPageDropTarget] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const defaultCollectionId = collectionStore.defaultCollectionId;
  const isExpanded = defaultCollectionId ? collectionStore.isCollectionExpanded(defaultCollectionId) : false;
  const currentPageId = currentPageIdParam?.toString();
  const manualExpandedPageIds = defaultCollectionId
    ? [...collectionStore.getCollectionSidebarExpandedRowIds(defaultCollectionId)]
    : [];
  const autoExpandedPageIds = defaultCollectionId
    ? collectionStore.getCollectionAutoExpandedAncestorIds(defaultCollectionId, currentPageId)
    : [];
  const isCurrentPageInDefaultCollection =
    !!currentPageId &&
    !!defaultCollectionId &&
    collectionStore.getEffectiveCollectionId(currentPageId) === defaultCollectionId;
  const expandedPageIds = [...new Set([...manualExpandedPageIds, ...autoExpandedPageIds])];
  const setExpandedPageIds = useCallback<React.Dispatch<React.SetStateAction<string[]>>>(
    (value) => {
      if (!defaultCollectionId) return;
      const previousPageIds = [...collectionStore.getCollectionSidebarExpandedRowIds(defaultCollectionId)];
      const nextPageIds = typeof value === "function" ? value(previousPageIds) : value;
      collectionStore.replaceCollectionSidebarExpandedRowIds(defaultCollectionId, nextPageIds);
    },
    [collectionStore, defaultCollectionId]
  );
  const handleReorderPages = useCallback(
    (pageId: string, targetPageId: string, position: "before" | "after") => {
      if (!defaultCollectionId) return;
      const targetPage = pageStore.getPageById(targetPageId);
      if (!targetPage?.id) return;

      void collectionStore.movePageWithCollectionContext({
        pageId,
        sourceCollectionId: defaultCollectionId,
        targetCollectionId: defaultCollectionId,
        targetParentId: targetPage.parent_id ?? null,
        reorderTargetPageId: targetPageId,
        reorderPosition: position,
      });
    },
    [collectionStore, defaultCollectionId, pageStore]
  );

  useEffect(() => {
    if (isActive && defaultCollectionId) {
      collectionStore.setCollectionExpanded(defaultCollectionId);
    }
  }, [collectionStore, defaultCollectionId, isActive]);

  useEffect(() => {
    if (!defaultCollectionId || !isCurrentPageInDefaultCollection) return;

    collectionStore.setCollectionExpanded(defaultCollectionId);
  }, [collectionStore, defaultCollectionId, isCurrentPageInDefaultCollection]);

  const { isLoading: isLoadingCollectionPages } = useSWR(
    isExpanded && defaultCollectionId ? ["general-collection-pages", workspaceSlug, defaultCollectionId] : null,
    () => collectionStore.fetchCollectionPages(workspaceSlug, defaultCollectionId ?? "general"),
    { revalidateOnFocus: false }
  );

  const rootPageIds = defaultCollectionId ? collectionStore.getCollectionRootPageIds(defaultCollectionId, {}) : [];
  const hasLoadedCollectionPages = defaultCollectionId
    ? collectionStore.pageCollectionIdsByCollection.has(defaultCollectionId)
    : false;
  const hasKnownPages = defaultCollectionId
    ? collectionStore.getCollectionViewPageIds(defaultCollectionId).size > 0
    : false;
  const showChevron = (hasKnownPages || !hasLoadedCollectionPages) && isHovering;
  const lastRootPageId = rootPageIds.at(-1);
  const handlePromotePageToRoot = useCallback(
    async (payload: TPageDragPayload) => {
      if (!defaultCollectionId) return;

      try {
        await collectionStore.movePageWithCollectionContext({
          pageId: payload.id,
          sourceCollectionId: payload.collectionId,
          targetCollectionId: defaultCollectionId,
          targetParentId: null,
          reorderTargetPageId: lastRootPageId && lastRootPageId !== payload.id ? lastRootPageId : undefined,
          reorderPosition: lastRootPageId && lastRootPageId !== payload.id ? "after" : undefined,
        });
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to move page. Please try again.",
        });
      }
    },
    [collectionStore, defaultCollectionId, lastRootPageId]
  );

  useEffect(() => {
    const element = rowRef.current;
    if (!element || !defaultCollectionId) return;

    return dropTargetForElements({
      element,
      onDragEnter: () => setIsPageDropTarget(true),
      onDragLeave: () => setIsPageDropTarget(false),
      onDrop: ({ location, self, source }) => {
        setIsPageDropTarget(false);
        if (location.current.dropTargets[0]?.element !== self.element) return;

        const payload = source.data as TPageDragPayload;
        if (!payload.id) return;

        if (payload.collectionId === defaultCollectionId) {
          if (!payload.parentId) return;

          void handlePromotePageToRoot(payload);
          return;
        }

        void (async () => {
          try {
            await collectionStore.movePageWithCollectionContext({
              pageId: payload.id,
              sourceCollectionId: payload.collectionId,
              targetCollectionId: defaultCollectionId,
              targetParentId: null,
            });
          } catch {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Failed to move page. Please try again.",
            });
          }
        })();
      },
      canDrop: ({ source }) => {
        const payload = source.data as TPageDragPayload;
        if (!payload.id) return false;

        if (!pageStore.isNestedPagesEnabled(workspaceSlug)) return false;

        const sourcePage = pageStore.getPageById(payload.id);
        if (sourcePage?.is_shared || !!sourcePage?.archived_at || sourcePage?.access !== EPageAccess.PUBLIC)
          return false;

        if (payload.collectionId === defaultCollectionId) {
          return (
            !!payload.parentId && collectionStore.canCurrentUserReorderPageInCollection(payload.id, defaultCollectionId)
          );
        }

        return collectionStore.canCurrentUserAddPageToCollection(payload.id);
      },
    });
  }, [collectionStore, defaultCollectionId, handlePromotePageToRoot, pageStore, workspaceSlug]);

  return (
    <div>
      <div
        ref={rowRef}
        className={cn(SIDEBAR_ROW_CLASS, {
          "bg-layer-transparent-hover": isPageDropTarget && !isActive,
          "bg-accent-primary/10 font-medium text-accent-primary hover:bg-accent-primary/10": isActive,
        })}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className={SIDEBAR_ROW_CONTENT_CLASS}>
          <div className="grid size-4 flex-shrink-0 place-items-center">
            {isLoadingCollectionPages ? (
              <Loader className="size-3.5 animate-spin" />
            ) : showChevron ? (
              <button
                type="button"
                className="grid size-4 place-items-center rounded-sm hover:bg-layer-transparent-hover"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (defaultCollectionId) {
                    collectionStore.toggleCollectionExpanded(defaultCollectionId);
                  }
                }}
                aria-label={isExpanded ? "Collapse collection" : "Expand collection"}
              >
                <ChevronRight
                  className={cn("size-3.5 transition-transform duration-200", {
                    "rotate-90": isExpanded,
                  })}
                />
              </button>
            ) : (
              <span className="grid size-4 place-items-center rounded-md bg-[#E4F6E9]">
                <Building2 className="size-3 text-[#00A63E]" />
              </span>
            )}
          </div>
          <button
            type="button"
            className="min-w-0 flex-1 cursor-pointer truncate text-left"
            onClick={() => router.push(`/${workspaceSlug}/wiki/collections/general`)}
          >
            <p className="min-w-0 truncate text-13">General</p>
          </button>
        </div>
        <div className="flex items-center justify-end pr-1 leading-none">
          <div
            className={cn("flex items-center gap-0.5 leading-none transition-opacity group-focus-within:opacity-100", {
              "pointer-events-none opacity-0": !isHovering,
            })}
          >
            <CollectionAddPageMenu
              workspaceSlug={workspaceSlug}
              targetCollectionId={defaultCollectionId}
              showAddExisting={!!defaultCollectionId}
              onOpenAddExisting={defaultCollectionId ? () => onOpenAddExistingPage(defaultCollectionId) : undefined}
              buttonType="icon"
            />
          </div>
        </div>
      </div>

      {isExpanded && defaultCollectionId && (
        <div className="mt-0.5">
          {(isLoadingCollectionPages || isMembershipsLoading) && rootPageIds.length === 0 && (
            <div className="flex items-center gap-2 py-1.5 pl-7 text-12 text-tertiary">
              <Loader className="size-3 animate-spin" />
              <span>Loading pages...</span>
            </div>
          )}
          {!isMembershipsLoading &&
            !isLoadingCollectionPages &&
            hasLoadedCollectionPages &&
            rootPageIds.length === 0 && (
              <div className="py-1.5 pl-7 text-12 text-tertiary">No pages in this collection</div>
            )}
          {rootPageIds.map((pageId, index) => (
            <WikiPageSidebarListItemRoot
              key={pageId}
              paddingLeft={12}
              pageId={pageId}
              collectionId={defaultCollectionId}
              getChildPageIds={(currentPageId) =>
                collectionStore.getCollectionChildPageIds(currentPageId, defaultCollectionId)
              }
              expandedPageIds={expandedPageIds}
              setExpandedPageIds={setExpandedPageIds}
              handleReorderPages={handleReorderPages}
              isLastChild={index === rootPageIds.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});

const CollectionsSectionContent = observer(function CollectionsSectionContent() {
  const { workspaceSlug, pageId: currentPageIdParam } = useParams();
  const pathname = usePathname();
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const [addExistingPageCollectionId, setAddExistingPageCollectionId] = useState<string | null>(null);
  const prefetchedBranchPageIdRef = useRef<string | null>(null);
  const wsSlug = workspaceSlug?.toString() ?? "";
  const isCollectionRoute = pathname?.includes("/wiki/collections/");
  const collectionStore = useCollection();
  const { fetchParentPages, getPageById } = usePageStore(EPageStoreType.WORKSPACE);
  const { allowPermissions } = useUserPermissions();
  const canCreateCollections = wsSlug
    ? allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE, wsSlug)
    : false;

  const { isLoading: isLoadingCollections } = useSWR(
    wsSlug ? collectionsListKey(wsSlug) : null,
    wsSlug ? () => collectionStore.fetchCollections(wsSlug) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  const { isLoading: isHydratingCollectionMemberships } = useSWR(
    wsSlug ? ["workspace-collection-memberships", wsSlug] : null,
    wsSlug
      ? async () => {
          await collectionStore.ensureCollectionMembershipsHydrated(wsSlug);
        }
      : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  const currentPageId = !isCollectionRoute && currentPageIdParam ? currentPageIdParam.toString() : undefined;
  const { data: parentPagesList } = useSWR(
    wsSlug && currentPageId ? ["collection-parent-pages", wsSlug, currentPageId] : null,
    wsSlug && currentPageId ? () => fetchParentPages(currentPageId) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (!wsSlug || !currentPageId || parentPagesList === undefined) return;
    if (prefetchedBranchPageIdRef.current === currentPageId) return;

    const ancestorPageIds = parentPagesList
      .map((page) => page.id)
      .filter((pageId): pageId is string => !!pageId && pageId !== currentPageId);

    void (async () => {
      const effectiveCollectionId = await collectionStore.resolveCollectionIdForPage(
        wsSlug,
        currentPageId,
        ancestorPageIds
      );
      if (effectiveCollectionId) {
        collectionStore.setCollectionExpanded(effectiveCollectionId);
        const existingExpandedPageIds = [...collectionStore.getCollectionSidebarExpandedRowIds(effectiveCollectionId)];
        const nextExpandedPageIds = [...new Set([...existingExpandedPageIds, ...ancestorPageIds])];

        if (nextExpandedPageIds.length !== existingExpandedPageIds.length) {
          collectionStore.replaceCollectionSidebarExpandedRowIds(effectiveCollectionId, nextExpandedPageIds);
        }
      }

      prefetchedBranchPageIdRef.current = currentPageId;
    })();
  }, [collectionStore, currentPageId, getPageById, parentPagesList, wsSlug]);

  const customCollections = useMemo(
    () => (collectionStore.workspaceCollections ?? []).filter((collection) => !collection.is_default),
    [collectionStore.workspaceCollections]
  );
  const hasDefaultCollection = !!collectionStore.defaultCollectionId;

  return (
    <>
      <CreateCollectionModal
        isOpen={isCreateCollectionModalOpen}
        onClose={() => setIsCreateCollectionModalOpen(false)}
        workspaceSlug={wsSlug}
      />

      {addExistingPageCollectionId && (
        <AddExistingPageModal
          isOpen={!!addExistingPageCollectionId}
          onClose={() => setAddExistingPageCollectionId(null)}
          collectionId={addExistingPageCollectionId}
          workspaceSlug={wsSlug}
        />
      )}

      <div className="flex flex-col rounded-md transition-colors">
        <div className="group flex items-center justify-between gap-1 rounded-md px-1 py-1.5 text-secondary transition-colors hover:bg-layer-transparent-hover">
          <span className="min-w-0 flex-1 truncate text-13 font-semibold text-placeholder">Collections</span>
          {canCreateCollections && (
            <button
              type="button"
              className="grid size-5 place-items-center rounded-md opacity-0 transition-opacity hover:bg-layer-transparent-hover group-hover:opacity-100 group-focus-within:opacity-100"
              aria-label="Create collection"
              onClick={() => setIsCreateCollectionModalOpen(true)}
            >
              <PlusIcon className="size-3.5" />
            </button>
          )}
        </div>

        {isLoadingCollections && !hasDefaultCollection && customCollections.length === 0 ? (
          <div className="ml-2 mt-2 flex items-center justify-center py-3">
            <Loader className="size-4 animate-spin text-placeholder" />
            <span className="ml-2 text-13 text-placeholder">Loading collections...</span>
          </div>
        ) : (
          <div className="mt-1 space-y-0.5">
            {hasDefaultCollection && (
              <GeneralCollectionItem
                workspaceSlug={wsSlug}
                isActive={pathname.replace(/\/$/, "") === `/${wsSlug}/wiki/collections/general`}
                isMembershipsLoading={isHydratingCollectionMemberships}
                onOpenAddExistingPage={setAddExistingPageCollectionId}
              />
            )}

            {customCollections.map((collection) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                workspaceSlug={wsSlug}
                isCollectionActive={pathname.replace(/\/$/, "") === `/${wsSlug}/wiki/collections/${collection.id}`}
                isMembershipsLoading={isHydratingCollectionMemberships}
                onOpenAddExistingPage={setAddExistingPageCollectionId}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
});

export const CollectionsSection = memo(CollectionsSectionContent);
