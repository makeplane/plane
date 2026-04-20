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

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArchiveIcon, Loader } from "lucide-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronRightIcon, EmptyPageIcon, PageIcon, RestrictedPageIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TPageDragPayload, TPageNavigationTabs } from "@plane/types";
import { EPageAccess } from "@plane/types";
import { cn, getPageName } from "@plane/utils";
import { useAppRouter } from "@/hooks/use-app-router";
import { EPageStoreType, useCollection, usePage, usePageStore } from "@/plane-web/hooks/store";

type Props = {
  handleToggleExpanded: () => void;
  onSubPagesLoaded?: () => void | Promise<void>;
  expandPage: () => void;
  isDragging: boolean;
  isExpanded: boolean;
  paddingLeft: number;
  pageId: string;
  isHovered?: boolean;
  canShowAddButton?: boolean;
  sectionType?: TPageNavigationTabs;
  collectionId?: string;
  onDropTargetChange: (isDropping: boolean) => void;
};

const getSectionTargetAccess = (sectionType?: TPageNavigationTabs): EPageAccess | undefined => {
  if (sectionType === "public") return EPageAccess.PUBLIC;
  if (sectionType === "private") return EPageAccess.PRIVATE;
  return undefined;
};

const clearExpandTimer = (timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
};

const WikiPageSidebarListItemComponent = observer(function WikiPageSidebarListItemComponent(props: Props) {
  const {
    handleToggleExpanded,
    onSubPagesLoaded,
    expandPage,
    isExpanded,
    paddingLeft,
    pageId,
    isHovered,
    canShowAddButton,
    sectionType,
    collectionId,
    onDropTargetChange,
  } = props;

  const [isFetchingSubPages, setIsFetchingSubPages] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const listItemContentRef = useRef<HTMLDivElement>(null);
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { workspaceSlug, pageId: currentPageIdParam } = useParams();
  const currentWorkspaceSlug = workspaceSlug?.toString();
  const router = useAppRouter();
  const page = usePage({
    pageId,
    storeType: EPageStoreType.WORKSPACE,
  });
  const collectionStore = useCollection();
  const { isNestedPagesEnabled, getPageById, movePageInternally } = usePageStore(EPageStoreType.WORKSPACE);

  const isDescriptionEmpty = page?.is_description_empty || page?.description_html === "<p></p>";
  const isPageActive = currentPageIdParam?.toString() === page?.id;
  const pageLink = page?.getRedirectionLink?.() ?? "";
  const shouldShowSubPagesButton = (page?.sub_pages_count ?? 0) > 0;
  const loadedSubPagesCount = page?.subPageIds?.length ?? 0;
  const hasLoadedAllSubPages = shouldShowSubPagesButton && loadedSubPagesCount >= (page?.sub_pages_count ?? 0);
  const collectionBranchState = collectionId
    ? collectionStore.getCollectionBranchState(collectionId, { parentId: pageId })
    : undefined;
  const shouldRefetchCollectionBranch =
    !!collectionId && (!collectionBranchState?.isLoaded || collectionBranchState.isStale);
  const showAddButton = !!isHovered && !!canShowAddButton;

  const baseName = getPageName(page?.name);
  const isRestrictedPage = !page?.canCurrentUserAccessPage;
  const pageContent = {
    displayName: isRestrictedPage ? "Restricted Access" : baseName,
    hasAccess: !isRestrictedPage,
    logo: (() => {
      if (isRestrictedPage) {
        return <RestrictedPageIcon className="size-3.5" />;
      }
      if (page?.logo_props?.in_use) {
        return <Logo logo={page.logo_props} size={14} type="lucide" />;
      }
      if (!isDescriptionEmpty) {
        return <PageIcon className="size-3.5" />;
      }
      return <EmptyPageIcon className="size-3.5" />;
    })(),
  };

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const handleSubPagesToggle = useCallback(
    async (event: React.MouseEvent | React.KeyboardEvent) => {
      event.stopPropagation();
      event.preventDefault();
      handleToggleExpanded();

      const shouldFetchSubPages = collectionId ? shouldRefetchCollectionBranch : !hasLoadedAllSubPages;
      if (isExpanded || !shouldFetchSubPages) {
        return;
      }

      setIsFetchingSubPages(true);
      try {
        if (collectionId && currentWorkspaceSlug) {
          await collectionStore.fetchCollectionBranchChildren(currentWorkspaceSlug, collectionId, pageId, {
            force: collectionBranchState?.isStale,
          });
        } else {
          await page?.fetchSubPages?.();
        }
        await onSubPagesLoaded?.();
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to fetch sub-pages. Please try again.",
        });
      } finally {
        setIsFetchingSubPages(false);
      }
    },
    [
      collectionBranchState?.isStale,
      collectionId,
      collectionStore,
      currentWorkspaceSlug,
      handleToggleExpanded,
      hasLoadedAllSubPages,
      isExpanded,
      onSubPagesLoaded,
      page,
      pageId,
      shouldRefetchCollectionBranch,
    ]
  );

  const handleNavigate = useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      event.stopPropagation();
      event.preventDefault();

      if (!pageContent.hasAccess) return;

      if ("metaKey" in event && (event.metaKey || event.ctrlKey)) {
        window.open(pageLink, "_blank", "noopener,noreferrer");
        return;
      }

      if (!isPageActive) {
        router.push(pageLink);
        return;
      }

      void handleSubPagesToggle(event);
    },
    [handleSubPagesToggle, isPageActive, pageContent.hasAccess, pageLink, router]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        handleNavigate(event);
      }
    },
    [handleNavigate]
  );

  useEffect(() => {
    const element = listItemContentRef.current;
    if (!element || !page?.id) return;

    const currentPageId = page.id;

    return combine(
      dropTargetForElements({
        element,
        onDragEnter: () => {
          onDropTargetChange(true);
          clearExpandTimer(expandTimerRef);
          expandTimerRef.current = setTimeout(() => {
            expandPage();
          }, 1000);
        },
        onDragLeave: () => {
          onDropTargetChange(false);
          clearExpandTimer(expandTimerRef);
        },
        onDrop: ({ location, self, source }) => {
          onDropTargetChange(false);
          clearExpandTimer(expandTimerRef);

          if (location.current.dropTargets[0]?.element !== self.element) return;

          const sourceData = source.data as TPageDragPayload;
          if (!sourceData.id) return;

          const droppedPageDetails = getPageById(sourceData.id);
          if (!droppedPageDetails) return;

          const targetAccess = getSectionTargetAccess(sectionType);
          const updatePayload: { parent_id: string; access?: EPageAccess } = {
            parent_id: currentPageId,
          };

          if (targetAccess !== undefined && droppedPageDetails.access !== targetAccess) {
            updatePayload.access = targetAccess;
          }

          if (collectionId) {
            void collectionStore.movePageWithCollectionContext({
              pageId: sourceData.id,
              sourceCollectionId: sourceData.collectionId,
              targetCollectionId: collectionId,
              targetParentId: currentPageId,
              access: updatePayload.access,
            });
            return;
          }

          void movePageInternally(sourceData.id, updatePayload);
        },
        canDrop: ({ source }) => {
          if (
            !page.canCurrentUserEditPage ||
            !page.isContentEditable ||
            !currentWorkspaceSlug ||
            !isNestedPagesEnabled(currentWorkspaceSlug) ||
            page.archived_at
          ) {
            return false;
          }

          const sourceData = source.data as TPageDragPayload;
          const droppedPageId = sourceData.id;
          if (!droppedPageId) return false;

          const sourcePage = getPageById(droppedPageId);
          if (!sourcePage) return false;

          const isSamePage = droppedPageId === page.id;
          const isImmediateParent = sourceData.parentId === page.id;
          const isAnyLevelChild = page.parentPageIds?.includes(droppedPageId);
          if (isSamePage || isImmediateParent || isAnyLevelChild) return false;

          if (collectionId && sourcePage.access !== EPageAccess.PUBLIC) return false;

          return true;
        },
      })
    );
  }, [
    collectionId,
    collectionStore,
    currentWorkspaceSlug,
    expandPage,
    getPageById,
    isNestedPagesEnabled,
    movePageInternally,
    onDropTargetChange,
    page,
    sectionType,
  ]);

  useEffect(
    () => () => {
      clearExpandTimer(expandTimerRef);
    },
    []
  );

  if (!page) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "group flex h-8 w-full items-center justify-between gap-1.5 rounded-md text-secondary hover:bg-layer-transparent-hover focus:bg-layer-transparent-active",
        {
          "bg-layer-transparent-active text-primary hover:bg-layer-transparent-active focus:bg-layer-transparent-active":
            isPageActive,
          "cursor-pointer": pageContent.hasAccess && !isPageActive,
          "cursor-default": !pageContent.hasAccess || isPageActive,
        }
      )}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={pageContent.displayName}
      aria-expanded={shouldShowSubPagesButton ? isExpanded : undefined}
      aria-disabled={!pageContent.hasAccess}
      aria-current={isPageActive ? "page" : undefined}
    >
      <div
        ref={listItemContentRef}
        className={cn("flex items-center gap-1 truncate", {
          "max-w-[calc(100%-28px)] pr-3": showAddButton,
          "w-full pr-1": !showAddButton,
        })}
        style={{ paddingLeft: `${paddingLeft + 4}px` }}
      >
        <div className="grid size-4 flex-shrink-0 place-items-center">
          {isFetchingSubPages || (shouldShowSubPagesButton && isHovering) ? (
            <button
              type="button"
              onClick={(event) => void handleSubPagesToggle(event)}
              className="grid place-items-center rounded-sm hover:bg-layer-transparent-hover"
              data-prevent-progress
            >
              {isFetchingSubPages ? (
                <Loader className="size-3.5 animate-spin" />
              ) : (
                <ChevronRightIcon
                  className={cn("size-3.5 transform transition-transform duration-300 ease-in-out", {
                    "rotate-90": isExpanded,
                  })}
                  strokeWidth={2.5}
                />
              )}
            </button>
          ) : (
            <span className="grid place-items-center">{pageContent.logo}</span>
          )}
        </div>
        <p className="min-w-0 flex-grow truncate text-13">{pageContent.displayName}</p>
      </div>
      {page.archived_at && (
        <div className="grid size-4 flex-shrink-0 place-items-center">
          <ArchiveIcon className="size-3.5 text-tertiary" />
        </div>
      )}
    </div>
  );
});

export const WikiPageSidebarListItem = memo(WikiPageSidebarListItemComponent);
