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
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArchiveIcon, Loader } from "lucide-react";
// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronRightIcon, EmptyPageIcon, PageIcon, RestrictedPageIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TPageDragPayload, TPageNavigationTabs } from "@plane/types";
import { EPageAccess } from "@plane/types";
import { cn, getPageName } from "@plane/utils";
// components
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { EPageStoreType, useCollection, usePage, usePageStore } from "@/plane-web/hooks/store";

type Props = {
  handleToggleExpanded: () => void;
  onSubPagesLoaded?: () => void | Promise<void>;
  isDragging: boolean;
  isExpanded: boolean;
  paddingLeft: number;
  pageId: string;
  isHovered?: boolean;
  canShowAddButton?: boolean;
  sectionType?: TPageNavigationTabs;
  collectionId?: string;
  setExpandedPageIds?: React.Dispatch<React.SetStateAction<string[]>>;
  setIsDropping: React.Dispatch<React.SetStateAction<boolean>>;
  setLocalIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
};

const WikiPageSidebarListItemComponent = observer(function WikiPageSidebarListItemComponent(props: Props) {
  const {
    handleToggleExpanded,
    onSubPagesLoaded,
    isExpanded,
    paddingLeft,
    pageId,
    isHovered,
    canShowAddButton,
    setExpandedPageIds,
    sectionType,
    collectionId,
    setIsDropping,
    setLocalIsExpanded,
  } = props;
  // states
  const [isFetchingSubPages, setIsFetchingSubPages] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  // refs
  const listItemContentRef = useRef<HTMLDivElement>(null);
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // navigation
  const { workspaceSlug, pageId: currentPageIdParam } = useParams();
  // router
  const router = useAppRouter();
  // derived values
  const page = usePage({
    pageId,
    storeType: EPageStoreType.WORKSPACE,
  });
  const collectionStore = useCollection();
  const { isNestedPagesEnabled, getPageById, movePageInternally } = usePageStore(EPageStoreType.WORKSPACE);
  const {
    fetchSubPages,
    is_description_empty,
    description_html,
    getRedirectionLink,
    sub_pages_count,
    archived_at,
    canCurrentUserAccessPage,
    logo_props,
    name,
  } = page ?? {};

  const isDescriptionEmpty = useMemo(
    () => is_description_empty || description_html === "<p></p>",
    [is_description_empty, description_html]
  );

  const isPageActive = useMemo(() => currentPageIdParam?.toString() === page?.id, [currentPageIdParam, page?.id]);

  const pageLink = useMemo(() => getRedirectionLink?.() ?? "", [getRedirectionLink]);

  const shouldShowSubPagesButton = useMemo(
    () => sub_pages_count !== undefined && sub_pages_count > 0,
    [sub_pages_count]
  );
  const loadedSubPagesCount = page?.subPageIds?.length ?? 0;
  const hasLoadedAllSubPages = shouldShowSubPagesButton && loadedSubPagesCount >= (sub_pages_count ?? 0);

  const showAddButton = isHovered && canShowAddButton;

  // Centralized page content and state based on conditions
  const pageContent = useMemo(() => {
    const baseName = getPageName(name);
    const isRestricted = !canCurrentUserAccessPage;
    const isArchived = !!archived_at;

    const displayName = (() => {
      if (isRestricted) return "Restricted Access";
      return baseName;
    })();

    return {
      tooltipText: baseName,
      logo: (() => {
        if (isRestricted) {
          return <RestrictedPageIcon className="size-3.5" />;
        }
        if (logo_props?.in_use) {
          return <Logo logo={logo_props} size={14} type="lucide" />;
        }
        if (!isDescriptionEmpty) {
          return <PageIcon className="size-3.5" />;
        }
        return <EmptyPageIcon className="size-3.5" />;
      })(),
      status: {
        isRestricted,
        isArchived,
        hasAccess: !isRestricted,
      },
      displayName,
    };
  }, [canCurrentUserAccessPage, archived_at, logo_props, isDescriptionEmpty, name]);

  // Memoize event handlers to prevent recreation
  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  const handleSubPagesToggle = useCallback(
    async (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleToggleExpanded();

      // Only fetch if expanding
      if (!isExpanded && !hasLoadedAllSubPages) {
        setIsFetchingSubPages(true);
        try {
          await fetchSubPages?.();
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
      }
    },
    [fetchSubPages, handleToggleExpanded, hasLoadedAllSubPages, isExpanded, onSubPagesLoaded]
  );

  const handleNavigate = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!pageContent?.status.hasAccess) {
        return;
      }

      if ("metaKey" in e && (e.metaKey || e.ctrlKey)) {
        window.open(pageLink, "_blank", "noopener,noreferrer");
        return;
      }

      // Regular click navigation
      if (!isPageActive) {
        router.push(pageLink);
      } else {
        void handleSubPagesToggle(e);
      }
    },
    [isPageActive, pageContent?.status.hasAccess, router, pageLink, handleSubPagesToggle]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Handle Enter and Space keys for accessibility
      if (e.key === "Enter" || e.key === " ") {
        handleNavigate(e);
      }
    },
    [handleNavigate]
  );

  const contentStyle = useMemo(() => ({ paddingLeft: `${paddingLeft + 4}px` }), [paddingLeft]);

  const chevronClassName = useMemo(
    () =>
      cn("size-3.5 transform transition-transform duration-300 ease-in-out", {
        "rotate-90": isExpanded,
      }),
    [isExpanded]
  );

  // drop as a sub-page
  useEffect(() => {
    const element = listItemContentRef.current;
    if (!element || !page || !page.id) return;

    const cleanup = combine(
      dropTargetForElements({
        element,
        onDragEnter: () => {
          setIsDropping(true);
          // Clear any existing timer
          if (expandTimerRef.current) {
            clearTimeout(expandTimerRef.current);
          }
          // Set new timer to expand after 1 second
          expandTimerRef.current = setTimeout(() => {
            if (setExpandedPageIds) {
              setExpandedPageIds((prev) => (prev.includes(pageId) ? prev : [...prev, pageId]));
            } else {
              setLocalIsExpanded(true);
            }
          }, 1000);
        },
        onDragLeave: () => {
          setIsDropping(false);
          // Clear the expand timer when drag leaves
          if (expandTimerRef.current) {
            clearTimeout(expandTimerRef.current);
            expandTimerRef.current = null;
          }
        },
        onDrop: ({ location, self, source }) => {
          // toggle drop state to off
          setIsDropping(false);
          // Clear the expand timer on drop
          if (expandTimerRef.current) {
            clearTimeout(expandTimerRef.current);
            expandTimerRef.current = null;
          }

          if (location.current.dropTargets[0]?.element !== self.element) return;
          if (!page.id) return;
          // get data of the dropped page(source)
          const { id: droppedPageId, collectionId: sourceCollectionId } = source.data as TPageDragPayload;
          const droppedPageDetails = getPageById(droppedPageId);
          if (!droppedPageDetails) return;
          // prepare update payload with the new parent_id
          const updatePayload: { parent_id?: string; access?: EPageAccess } = {
            parent_id: page.id,
          };
          // get the access of the parent page based on the section type
          let targetAccess: EPageAccess | undefined;
          if (sectionType === "public") {
            targetAccess = EPageAccess.PUBLIC;
          } else if (sectionType === "private") {
            targetAccess = EPageAccess.PRIVATE;
          }
          // check if access needs to be updated (section has changed)
          if (targetAccess !== undefined && droppedPageDetails.access !== targetAccess) {
            updatePayload.access = targetAccess;
          }
          // Keep collection membership in sync when nesting across collections.
          if (collectionId) {
            void collectionStore.movePageWithCollectionContext({
              pageId: droppedPageId,
              sourceCollectionId,
              targetCollectionId: collectionId,
              targetParentId: page.id,
              access: updatePayload.access,
            });
            return;
          }

          // make the API call to update the page
          void movePageInternally(droppedPageId, updatePayload);
        },
        canDrop: ({ source }) => {
          // check if the page is editable
          if (
            !page.canCurrentUserEditPage ||
            !page.isContentEditable ||
            !isNestedPagesEnabled(workspaceSlug.toString()) ||
            page.archived_at
          ) {
            return false;
          }
          // get the data of the page being dropped(source)
          const { id: droppedPageId, parentId: droppedPageParentId } = source.data as TPageDragPayload;
          if (!droppedPageId) return false;
          // get the source page instance
          const sourcePage = getPageById(droppedPageId);
          if (!sourcePage) return false;
          // check if the page being dragged is the same page or the immediate parent or any level child
          const isSamePage = droppedPageId === page.id;
          const isImmediateParent = droppedPageParentId === page.id;
          const isAnyLevelChild = page.parentPageIds?.includes(droppedPageId);

          if (isSamePage || isImmediateParent || isAnyLevelChild) return false;

          // Block private pages from being dropped into a collection
          if (collectionId && sourcePage.access !== EPageAccess.PUBLIC) return false;

          // Allow dropping shared pages onto any accessible page
          if (sourcePage.is_shared) {
            return true;
          }

          return true;
        },
      })
    );

    return () => {
      cleanup();
      // Clear any pending timer on unmount
      if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current);
        expandTimerRef.current = null;
      }
    };
  }, [
    getPageById,
    page,
    pageId,
    setExpandedPageIds,
    setIsDropping,
    setLocalIsExpanded,
    isNestedPagesEnabled,
    movePageInternally,
    collectionStore,
    workspaceSlug,
    sectionType,
    collectionId,
  ]);

  if (!page) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "group w-full flex items-center justify-between gap-1 py-1.5 rounded-md text-secondary hover:bg-layer-transparent-hover focus:bg-layer-transparent-active",
        {
          "bg-accent-primary/10 hover:bg-accent-primary/10 text-accent-primary font-medium": isPageActive,
          "cursor-pointer": pageContent?.status.hasAccess && !isPageActive,
          "cursor-default": !pageContent?.status.hasAccess || isPageActive,
        }
      )}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={pageContent?.displayName}
      aria-expanded={shouldShowSubPagesButton ? isExpanded : undefined}
      aria-disabled={pageContent?.status.hasAccess ?? true}
      aria-current={isPageActive ? "page" : undefined}
    >
      <div
        ref={listItemContentRef}
        className={cn("flex items-center gap-1 truncate", {
          "max-w-[calc(100%-28px)] pr-3": showAddButton,
          "w-full pr-1": !showAddButton,
        })}
        style={contentStyle}
      >
        <div className="size-4 flex-shrink-0 grid place-items-center">
          {isFetchingSubPages || (shouldShowSubPagesButton && isHovering) ? (
            <button
              type="button"
              onClick={(event) => void handleSubPagesToggle(event)}
              className="rounded-sm hover:bg-layer-transparent-hover grid place-items-center"
              data-prevent-progress
            >
              {isFetchingSubPages ? (
                <Loader className="size-3.5 animate-spin" />
              ) : (
                <ChevronRightIcon className={chevronClassName} strokeWidth={2.5} />
              )}
            </button>
          ) : (
            <span className="grid place-items-center">{pageContent?.logo}</span>
          )}
        </div>
        <p className="truncate text-13 flex-grow min-w-0">{pageContent?.displayName}</p>
      </div>
      {archived_at && (
        <div className="flex-shrink-0 size-4 grid place-items-center">
          <ArchiveIcon className="size-3.5 text-tertiary" />
        </div>
      )}
    </div>
  );
});

export const WikiPageSidebarListItem = memo(WikiPageSidebarListItemComponent);
