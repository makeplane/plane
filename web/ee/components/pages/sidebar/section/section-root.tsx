import { useRef, useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
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

export const WikiSidebarListSectionRoot: React.FC<SectionRootProps> = observer((props) => {
  const { expandedPageIds, sectionType, setExpandedPageIds, currentPageId } = props;
  // states
  const [isCreatingPage, setIsCreatingPage] = useState<TPageNavigationTabs | null>(null);
  const [shouldBeOpen, setShouldBeOpen] = useState<boolean>(false);
  const [hasTriggeredOpen, setHasTriggeredOpen] = useState<boolean>(false);
  // refs
  const listSectionRef = useRef<HTMLDivElement>(null);
  const disclosureButtonRef = useRef<HTMLButtonElement>(null);
  // hooks
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  const { sidebarCollapsed } = useAppTheme();
  const pageStore = usePageStore(EPageStoreType.WORKSPACE);
  const { createPage, getPageById, publicPageIds, privatePageIds, archivedPageIds } = pageStore;
  // Custom hooks
  const { isDropping } = useSectionDragAndDrop(listSectionRef, getPageById);
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
      default:
        return [];
    }
  }, [publicPageIds, privatePageIds, archivedPageIds, sectionType]);

  // Use SWR pageIds when loading, store pageIds when SWR is done
  const pageIds = getStorePageIds();
  // Helper function to get all parent IDs of a page
  const getParentIdsChain = useCallback(
    (pageId: string): string[] => {
      const parentIds: string[] = [];
      let currentPage = getPageById(pageId);
      while (currentPage && currentPage.parent_id) {
        parentIds.push(currentPage.parent_id);
        currentPage = getPageById(currentPage.parent_id);
      }
      return parentIds;
    },
    [getPageById]
  );
  // Check if current page belongs to this section and update shouldBeOpen
  useEffect(() => {
    // Default - only public section is open when no page is selected
    if (!currentPageId) {
      setShouldBeOpen(sectionType === "public");
      return;
    }
    // If current page belongs to this section, open it
    if (pageIds.includes(currentPageId)) {
      setShouldBeOpen(true);
      return;
    }
    // Check if the current page is a child page of any page in this section
    const currentPage = getPageById(currentPageId);
    if (currentPage && currentPage.parent_id) {
      // Get the root parent of the current page
      let parentId = currentPage.parent_id;
      let parentPage = getPageById(parentId);
      // Navigate up the parent chain until we find a top-level parent
      while (parentPage && parentPage.parent_id) {
        parentId = parentPage.parent_id;
        parentPage = getPageById(parentId);
      }
      // If the root parent is in this section, open the section
      if (parentPage && pageIds.includes(parentId)) {
        setShouldBeOpen(true);
        return;
      }
    }
    // Otherwise, close unless it's the public section with no current page
    setShouldBeOpen(false);
  }, [currentPageId, pageIds, sectionType, getPageById]);
  // Expand parent pages when a child page is selected
  useEffect(() => {
    if (!currentPageId || !setExpandedPageIds) return;
    const currentPage = getPageById(currentPageId);
    if (!currentPage) return;
    // Check if the current page belongs to this section
    const belongsToSection =
      pageIds.includes(currentPageId) ||
      (currentPage.parent_id && getParentIdsChain(currentPageId).some((id) => pageIds.includes(id)));
    if (belongsToSection) {
      // Get all parent IDs that need to be expanded
      const parentIds = getParentIdsChain(currentPageId);
      // Add all parent IDs to expandedPageIds if not already included
      if (parentIds.length > 0) {
        setExpandedPageIds((prev) => {
          const newExpandedIds = [...prev];
          parentIds.forEach((id) => {
            if (!newExpandedIds.includes(id)) {
              newExpandedIds.push(id);
            }
          });
          return newExpandedIds;
        });
      }
    }
  }, [currentPageId, pageIds, getPageById, setExpandedPageIds, getParentIdsChain]);
  useEffect(() => {
    // Skip if we've already triggered for this state or if still loading
    if (hasTriggeredOpen || isLoading) return;
    const button = disclosureButtonRef.current;
    if (!button) return;
    // Get the current open state from the button's aria-expanded attribute
    const isCurrentlyOpen = button.getAttribute("aria-expanded") === "true";
    // Only click if the current state doesn't match the desired state
    if (shouldBeOpen !== isCurrentlyOpen) {
      button.click();
    }
    setHasTriggeredOpen(true);
  }, [shouldBeOpen, hasTriggeredOpen, isLoading, sectionType]);
  // Reset the trigger state when shouldBeOpen changes
  useEffect(() => {
    setHasTriggeredOpen(false);
  }, [shouldBeOpen]);
  // derived values
  const isCollapsed = !!sidebarCollapsed;
  const sectionDetails = SECTION_DETAILS[sectionType];
  // handle page create
  const handleCreatePage = async (pageType: TPageNavigationTabs) => {
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
  };
  // Initial default open state - only public section opens by default without a current page
  const initialOpenState = !currentPageId && sectionType === "public";
  return (
    <div
      ref={listSectionRef}
      className={cn("flex flex-col rounded-md transition-colors", {
        "[&:not(:has(.is-dragging))]:bg-custom-primary-100/20": isDropping,
      })}
    >
      <Disclosure defaultOpen={initialOpenState}>
        {({ open }) => (
          <>
            <SectionHeader
              sectionType={sectionType}
              sectionDetails={sectionDetails}
              isCollapsed={isCollapsed}
              isCreatingPage={isCreatingPage}
              handleCreatePage={handleCreatePage}
              buttonRef={disclosureButtonRef}
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
              <SectionContent
                isCollapsed={isCollapsed}
                pageIds={pageIds}
                sectionType={sectionType}
                expandedPageIds={expandedPageIds}
                setExpandedPageIds={setExpandedPageIds}
              />
            </Transition>
          </>
        )}
      </Disclosure>
    </div>
  );
});
