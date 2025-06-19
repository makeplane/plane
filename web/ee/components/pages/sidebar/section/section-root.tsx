import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// lucide icons
import { Loader } from "lucide-react";
// ui
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { EPageAccess } from "@plane/constants";
import { TPage, TPageNavigationTabs } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// local imports
import { SectionHeader, SectionContent } from "./components";
import { SECTION_DETAILS } from "./constants";
import { useSectionDragAndDrop, useSectionPages } from "./hooks";
import { SectionRootProps } from "./types";

// Wrap the component to prevent re-renders from parent
const WikiSidebarListSectionRootContent: React.FC<SectionRootProps> = observer((props) => {
  const { expandedPageIds, sectionType, setExpandedPageIds, currentPageId } = props;

  // states
  const [isCreatingPage, setIsCreatingPage] = useState<TPageNavigationTabs | null>(null);
  const [isManuallyToggled, setIsManuallyToggled] = useState<boolean>(false);
  const [manualOpenState, setManualOpenState] = useState<boolean | null>(null);
  // Show the loader immediately on mount - controlled by our own state
  const [showLoader, setShowLoader] = useState<boolean>(true);

  // refs
  const listSectionRef = useRef<HTMLDivElement>(null);
  const disclosureButtonRef = useRef<HTMLButtonElement>(null);

  // hooks
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  const { sidebarCollapsed } = useAppTheme();
  const { createPage, getPageById, publicPageIds, privatePageIds, archivedPageIds, sharedPageIds } = usePageStore(
    EPageStoreType.WORKSPACE
  );

  // Custom hooks
  const { isDropping } = useSectionDragAndDrop(listSectionRef, getPageById, sectionType);
  const { isLoading } = useSectionPages(sectionType);

  // Get the page IDs based on section type directly from store's observable arrays
  const getStorePageIds = useCallback(() => {
    switch (sectionType) {
      case "public":
        return publicPageIds;
      case "private":
        return privatePageIds;
      case "archived":
        return archivedPageIds;
      case "shared":
        return sharedPageIds;
      default:
        return [];
    }
  }, [publicPageIds, privatePageIds, archivedPageIds, sharedPageIds, sectionType]);

  // Memoize derived values
  const pageIds = useMemo(() => getStorePageIds(), [getStorePageIds]);
  const isCollapsed = useMemo(() => !!sidebarCollapsed, [sidebarCollapsed]);
  const sectionDetails = useMemo(() => SECTION_DETAILS[sectionType], [sectionType]);

  // Add this ref to track the previous section of the active page
  const previousPageSectionRef = useRef<TPageNavigationTabs | null>(null);

  // Add this effect to detect page type changes and then scroll to that in the sidebar
  useEffect(() => {
    // Skip if no current page is selected
    if (!currentPageId) return;

    const currentPage = getPageById(currentPageId);
    // Determine current section of the page
    const currentPageSection = currentPage?.archived_at
      ? "archived"
      : currentPage?.is_shared
        ? "shared"
        : currentPage?.access === EPageAccess.PRIVATE
          ? "private"
          : "public";

    if (!currentPageSection) return;

    // Get the previous section
    const prevSection = previousPageSectionRef.current;

    // If this is the first check, just store the current section and exit
    if (prevSection === null) {
      previousPageSectionRef.current = currentPageSection;
      return;
    }

    // If the page has changed sections
    if (prevSection !== currentPageSection) {
      // Update the ref for next comparison
      previousPageSectionRef.current = currentPageSection;

      // If the page has moved to this section, open it
      if (currentPageSection === sectionType) {
        // Reset manual toggle state to allow automatic opening
        setIsManuallyToggled(false);
        setManualOpenState(true);
      }
    }
  }, [currentPageId, sectionType, getPageById]);

  // Get all pages in this section
  const sectionPages = useMemo(() => new Set(pageIds), [pageIds]);

  // Memoize check for section containing current page or its ancestors
  const sectionContainsActivePage = useMemo(() => {
    if (!currentPageId) return false;

    const currentPage = getPageById(currentPageId);

    // Direct match
    if (sectionPages.has(currentPageId)) return true;

    // Check ancestors
    if (!currentPage?.parent_id) return false;

    // Track all parents up to root
    let parentId: string | null | undefined = currentPage.parent_id;
    while (parentId) {
      const parent = getPageById(parentId);
      if (!parent || !parent.id) break;

      if (sectionPages.has(parent.id)) return true;

      parentId = parent.parent_id;
    }

    return false;
  }, [currentPageId, sectionPages, getPageById]);

  // Control loader visibility based on pageIds and loading state
  useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
    } else if (pageIds.length > 0) {
      // Short delay to prevent flickering if data arrives quickly
      const timer = setTimeout(() => setShowLoader(false), 100);
      return () => clearTimeout(timer);
    } else {
      setShowLoader(false);
    }
  }, [isLoading, pageIds]);

  // Determine if section should be open (memoized for stability)
  const shouldSectionBeOpen = useMemo(() => {
    // If user has manually toggled the section to open, respect their choice
    if (isManuallyToggled && manualOpenState === true) {
      return true;
    }

    // Default rules:
    // 1. Public section is open by default when no page is selected
    if (!currentPageId && sectionType === "public") {
      return true;
    }

    // 2. If the section contains the active page or its ancestors, open it
    if (sectionContainsActivePage) {
      return true;
    }

    // 3. Keep current state (never force close)
    return undefined;
  }, [isManuallyToggled, manualOpenState, currentPageId, sectionType, sectionContainsActivePage]);

  // Handler for manual toggling by user - only allow opening, not closing
  const handleManualToggle = useCallback((open: boolean) => {
    // Only process if we're opening the section
    if (open === true) {
      setIsManuallyToggled(true);
      setManualOpenState(true);
    }
  }, []);

  // Update disclosure state when it needs to change - only for opening
  useEffect(() => {
    // Skip if shouldSectionBeOpen is undefined (don't force close)
    if (shouldSectionBeOpen === undefined) return;

    const button = disclosureButtonRef.current;
    if (!button) return;

    // Get current disclosure state
    const isCurrentlyOpen = button.getAttribute("aria-expanded") === "true";

    // Only open if needed, never close
    if (isCurrentlyOpen === false && shouldSectionBeOpen === true) {
      button.click();
    }
  }, [shouldSectionBeOpen]);

  // Handle sidebar expansion - ensure section is open when sidebar is expanded
  useEffect(() => {
    // Only run when sidebar transitions from collapsed to expanded
    if (isCollapsed === false && disclosureButtonRef.current && shouldSectionBeOpen) {
      // Short delay to allow the sidebar transition to complete
      const timer = setTimeout(() => {
        const button = disclosureButtonRef.current;
        if (!button) return;

        // Check the current open state
        const isCurrentlyOpen = button.getAttribute("aria-expanded") === "true";

        // Only click if not already open
        if (!isCurrentlyOpen) {
          button.click();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isCollapsed, shouldSectionBeOpen]);

  // Memoize handleCreatePage
  const handleCreatePage = useCallback(
    async (pageType: TPageNavigationTabs) => {
      setIsCreatingPage(pageType);
      const payload: Partial<TPage> = {
        access: pageType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC,
      };
      await createPage(payload)
        .then((res) => {
          const pageId = `/${workspaceSlug}/pages/${res?.id}`;
          router.push(pageId);
        })
        .catch((err) =>
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: err?.data?.error || "Page could not be created. Please try again.",
          })
        )
        .finally(() => setIsCreatingPage(null));
    },
    [createPage, router, workspaceSlug]
  );

  // Expand parent pages when a child page is selected
  useEffect(() => {
    if (!currentPageId || !setExpandedPageIds) return;

    // Only expand parents if the page belongs to this section
    const belongsToThisSection = sectionContainsActivePage;
    if (!belongsToThisSection) return;

    // Get all parent IDs that need to be expanded
    const parentIds: string[] = [];
    const currentPage = getPageById(currentPageId);
    if (!currentPage) return;
    let parentPage = currentPage;

    while (parentPage.parent_id) {
      parentIds.push(parentPage.parent_id);
      const nextParent = getPageById(parentPage.parent_id);
      if (!nextParent) break;
      parentPage = nextParent;
    }

    if (parentIds.length === 0) return;

    // Use more efficient update with Set
    setExpandedPageIds((prev) => {
      // Create a Set for O(1) lookup efficiency
      const expandedSet = new Set(prev);
      let hasChanges = false;

      // Add each missing parent ID
      parentIds.forEach((id) => {
        if (!expandedSet.has(id)) {
          expandedSet.add(id);
          hasChanges = true;
        }
      });

      // Only create a new array if there were changes
      return hasChanges ? Array.from(expandedSet) : prev;
    });
  }, [currentPageId, sectionContainsActivePage, getPageById, setExpandedPageIds]);

  return (
    <div
      ref={listSectionRef}
      className={cn("flex flex-col rounded-md transition-colors", {
        "[&:not(:has(.is-dragging))]:bg-custom-primary-100/20": isDropping,
      })}
    >
      <Disclosure defaultOpen={shouldSectionBeOpen === true}>
        {({ open }) => {
          // Sync manual state when user toggles via disclosure
          React.useEffect(() => {
            if (open !== manualOpenState && isManuallyToggled) {
              setManualOpenState(open);
            }
          }, [open]);

          return (
            <>
              <SectionHeader
                sectionType={sectionType}
                sectionDetails={sectionDetails}
                isCollapsed={isCollapsed}
                isCreatingPage={isCreatingPage}
                handleCreatePage={handleCreatePage}
                buttonRef={disclosureButtonRef}
                onButtonClick={() => handleManualToggle(true)}
              />
              <Transition
                show={open}
                enter="transition-all duration-200 ease-out"
                enterFrom="opacity-0 max-h-0 -translate-y-2"
                enterTo="opacity-100 max-h-[1000px] translate-y-0"
                leave="transition-all duration-150 ease-in"
                leaveFrom="opacity-100 max-h-[1000px] translate-y-0"
                leaveTo="opacity-0 max-h-0 -translate-y-2"
                className="overflow-hidden"
              >
                {showLoader ? (
                  <div className="ml-2 mt-2 flex items-center justify-center py-3">
                    <Loader className="size-4 animate-spin text-custom-text-300" />
                    <span className="ml-2 text-sm text-custom-text-300">Loading pages...</span>
                  </div>
                ) : (
                  <SectionContent
                    isCollapsed={isCollapsed}
                    pageIds={pageIds}
                    sectionType={sectionType}
                    expandedPageIds={expandedPageIds}
                    setExpandedPageIds={setExpandedPageIds}
                  />
                )}
              </Transition>
            </>
          );
        }}
      </Disclosure>
    </div>
  );
});

// Wrap with memo to prevent unnecessary re-renders from parent
export const WikiSidebarListSectionRoot = memo(WikiSidebarListSectionRootContent);
