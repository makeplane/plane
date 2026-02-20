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

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { TPageEmbedConfig } from "@plane/editor";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { EmptyPageIcon, PageIcon, RestrictedPageIcon } from "@plane/propel/icons";
import type { TPage } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
import { cn, getPageName } from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web components
import { ArchivedBadge, PageEmbedPreview, PlaceholderEmbed } from "@/plane-web/components/pages";
// plane web store
import { EPageStoreType, usePage, usePageStore } from "@/plane-web/hooks/store";

type Props = {
  embedPageId: string;
  previewDisabled?: boolean;
  storeType: EPageStoreType;
  redirectLink?: string;
  onPageDrop?: (droppedPageId: string) => void;
  isDroppable?: boolean;
  pageDetails?: TPage;
  updateAttributes?: Parameters<TPageEmbedConfig["widgetCallback"]>[0]["updateAttributes"];
  parentPage?: TPage;
};

type PageDisplayState = {
  logo?: React.ReactNode;
  badge?: React.ReactNode;
  text: string;
  modalTitle?: string;
  modalDescription?: string;
  modalIcon?: React.ReactNode;
  bgColor?: string;
};

// Component that renders page embed content once embedPageId is defined
export const PageEmbedContent = observer(function PageEmbedContent(props: Props) {
  const {
    embedPageId,
    previewDisabled = false,
    storeType,
    redirectLink,
    onPageDrop,
    isDroppable = true,
    pageDetails,
  } = props;
  // states
  const [openModal, setOpenModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedInside, setDraggedInside] = useState(false);
  const [hasMouseMoved, setHasMouseMoved] = useState(false);
  // refs
  const dropTargetRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragCountRef = useRef(0); // Used to track enter/leave events for nested elements
  const dragStateRef = useRef<{ timer: ReturnType<typeof setTimeout> | null; nesting: boolean }>({
    timer: null,
    nesting: false,
  });
  // navigation
  const { workspaceSlug } = useParams();
  const router = useAppRouter();
  // store hooks - only use store if subPageDetail is not available
  const storePageData = usePage({ pageId: embedPageId, storeType });
  const { fetchPageDetails, isNestedPagesEnabled } = usePageStore(storeType);

  // Use subPageDetail if available, otherwise use store data
  const page = pageDetails || storePageData;
  // derived values
  const { logo_props, name, archived_at, is_description_empty, description_html } = page ?? {};

  const hasAccess = storePageData?.canCurrentUserAccessPage;
  const isDescriptionEmpty = useMemo(
    () => is_description_empty || description_html === "<p></p>",
    [is_description_empty, description_html]
  );

  const [displayState, setDisplayState] = useState<PageDisplayState>({
    text: getPageName(name),
  });

  useEffect(() => {
    if (!embedPageId || !workspaceSlug || pageDetails) return;

    const getPage = async () => {
      if (storeType === EPageStoreType.WORKSPACE) {
        // @ts-expect-error - fix this
        await fetchPageDetails(embedPageId, {
          shouldFetchSubPages: false,
          trackVisit: false,
        });
      }
    };
    if (!storePageData) {
      getPage();
    }
  }, [embedPageId, workspaceSlug, storePageData, fetchPageDetails, storeType, pageDetails]);

  useEffect(() => {
    const getDisplayState = (): PageDisplayState => {
      if (archived_at && hasAccess) {
        return {
          text: getPageName(name),
          badge: <ArchivedBadge />,
        };
      } else if (!hasAccess && page?.id) {
        return {
          logo: <RestrictedPageIcon className="size-4" />,
          text: "Restricted Page",
          modalTitle: "This sub-page has been restricted.",
          modalDescription: "You can't access this page.",
        };
      }
      return {
        text: getPageName(name),
      };
    };

    setDisplayState(getDisplayState());
  }, [name, archived_at, page?.id, hasAccess, description_html, workspaceSlug]);

  // Function to determine the appropriate logo to display
  const pageEmbedLogo = useMemo(() => {
    let logo;
    if (displayState.logo) {
      logo = displayState.logo;
    } else if (logo_props?.in_use) {
      logo = <Logo logo={logo_props} size={16} type="lucide" />;
    } else if (!isDescriptionEmpty) {
      logo = <PageIcon height={16} width={16} type="lucide" />;
    } else {
      logo = <EmptyPageIcon className="size-4" />;
    }
    return logo;
  }, [displayState.logo, logo_props, isDescriptionEmpty]);

  const handleMouseEnter = useCallback(() => {
    // Reset the mouse movement state when mouse enters
    setHasMouseMoved(false);
    // Don't start the timer yet - wait for mouse movement
  }, []);

  const handleMouseMove = useCallback(() => {
    // If mouse has already moved or timer is already set, don't do anything
    if (hasMouseMoved || hoverTimerRef.current) return;

    // Mark that mouse has moved
    setHasMouseMoved(true);

    // Start the timer now that mouse has both entered and moved
    hoverTimerRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 600);
  }, [hasMouseMoved]);

  const handleMouseLeave = useCallback(() => {
    setShowPreview(false);
    setHasMouseMoved(false);
    // Clear the timer if the mouse leaves before the delay completes
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (dragStateRef.current.timer) clearTimeout(dragStateRef.current.timer);
    },
    []
  );

  // Add keydown event listener only when preview is open
  useEffect(() => {
    const handleKeyDown = () => {
      setShowPreview(false);
    };

    if (showPreview) {
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [showPreview]);

  // Helper to check if the drag data contains a page-embed-component
  const isPageEmbedDrag = useCallback(
    (e: React.DragEvent): boolean => {
      if (!isDroppable || !onPageDrop) return false;
      // During dragenter/dragover, we can only check types, not data (browser restriction)
      // We rely on the text/html type being present as a signal for editor drag content
      return e.dataTransfer.types.includes("text/html");
    },
    [isDroppable, onPageDrop]
  );

  const onDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!isPageEmbedDrag(e)) return;
      dragCountRef.current += 1;
      if (dragCountRef.current === 1) {
        dragStateRef.current.timer = setTimeout(() => {
          dragStateRef.current.nesting = true;
          setDraggedInside(true);
          if (dropTargetRef.current) dropTargetRef.current.dataset.dropTargetActive = "true";
        }, 1000);
      }
    },
    [isPageEmbedDrag]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isPageEmbedDrag(e)) return;

      e.preventDefault();

      // Set the drop effect
      e.dataTransfer.dropEffect = "move";
    },
    [isPageEmbedDrag]
  );

  const onDragLeave = useCallback(
    (_e: React.DragEvent) => {
      if (!isDroppable) return;
      dragCountRef.current -= 1;
      if (dragCountRef.current === 0) {
        const s = dragStateRef.current;
        if (s.timer) clearTimeout(s.timer);
        s.timer = null;
        s.nesting = false;
        setDraggedInside(false);
        if (dropTargetRef.current) delete dropTargetRef.current.dataset.dropTargetActive;
      }
    },
    [isDroppable]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      const wasNesting = dragStateRef.current.nesting;
      const s = dragStateRef.current;
      if (s.timer) clearTimeout(s.timer);
      s.timer = null;
      s.nesting = false;
      dragCountRef.current = 0;
      setDraggedInside(false);
      if (dropTargetRef.current) delete dropTargetRef.current.dataset.dropTargetActive;

      if (!wasNesting || !isDroppable || !onPageDrop) return;

      const htmlString = e.dataTransfer.getData("text/html");
      if (!htmlString) return;
      try {
        const el = new DOMParser().parseFromString(htmlString, "text/html").body.firstElementChild;
        const droppedPageId =
          el?.tagName?.toLowerCase() === "page-embed-component" ? el.getAttribute("entity_identifier") : null;
        if (droppedPageId && droppedPageId !== embedPageId && !page?.archived_at) {
          e.preventDefault();
          e.stopPropagation();
          onPageDrop(droppedPageId);
        }
      } catch (err) {
        console.error("Error processing dropped page:", err);
      }
    },
    [isDroppable, onPageDrop, embedPageId, page?.archived_at]
  );

  if (page?.name === null) {
    return <PlaceholderEmbed />;
  }

  // Determine if we should show the preview based on various conditions
  const shouldShowPreview =
    !previewDisabled && hasAccess && showPreview && page && isNestedPagesEnabled(workspaceSlug?.toString());

  return (
    <>
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={dropTargetRef}
          role="button"
          data-drag-handle
          className={cn(
            "page-embed cursor-pointer rounded-md py-2 px-2 my-1.5 transition-colors duration-150 flex items-center gap-1.5 !no-underline hover:bg-layer-transparent-hover ease border border-transparent",
            {
              "!border !border-dashed !border-accent-strong !bg-accent-primary/10": draggedInside && isDroppable,
            },
            displayState.bgColor
          )}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (e.metaKey) {
              window.open(redirectLink, "_blank");
            } else {
              if (redirectLink) {
                router.push(redirectLink);
              }
            }
          }}
        >
          {pageEmbedLogo}
          <div className="flex-shrink-0 flex items-center gap-3">
            <p className="not-prose text-(--font-size-regular) font-medium break-words truncate underline decoration-custom-text-300 underline-offset-4">
              {displayState.text}
            </p>
            {displayState?.badge}
          </div>
        </div>

        {shouldShowPreview && <PageEmbedPreview page={page} storeType={storeType} logo={pageEmbedLogo} />}
      </div>

      {displayState?.modalTitle && (
        <AlertModalCore
          variant="primary"
          customIcon={displayState?.modalIcon}
          isOpen={openModal}
          handleClose={() => setOpenModal(false)}
          handleSubmit={() => {
            setOpenModal(false);
            if (redirectLink) {
              router.push(redirectLink);
            }
          }}
          isSubmitting={false}
          title={displayState?.modalTitle}
          content={displayState?.modalDescription}
          primaryButtonText={{
            loading: "Redirecting...",
            default: "Take me there",
          }}
          secondaryButtonText="Stay on this page"
        />
      )}
    </>
  );
});
