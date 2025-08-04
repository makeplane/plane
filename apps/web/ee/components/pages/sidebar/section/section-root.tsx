import React, { useEffect, useMemo, memo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// lucide icons
import { Loader } from "lucide-react";
// ui
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { EPageAccess, WORKSPACE_PAGE_TRACKER_EVENTS } from "@plane/constants";
import { TPage, TPageNavigationTabs } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// local imports
import { SectionHeader, SectionContent } from "./components";
import { SECTION_DETAILS } from "./constants";
import { useSectionDragAndDrop, useSectionPages } from "./hooks";
import { SectionRootProps } from "./types";

const WikiSidebarListSectionRootContent: React.FC<SectionRootProps> = observer((props) => {
  const { expandedPageIds, sectionType, setExpandedPageIds, currentPageId } = props;

  // states
  const [isCreatingPage, setIsCreatingPage] = useState<TPageNavigationTabs | null>(null);

  // refs
  const listSectionRef = useRef<HTMLDivElement>(null);

  // hooks
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  const { createPage, getPageById, publicPageIds, privatePageIds, archivedPageIds, sharedPageIds } = usePageStore(
    EPageStoreType.WORKSPACE
  );

  // feature flag check for shared pages
  const isSharedPagesEnabled = useFlag(workspaceSlug?.toString(), "SHARED_PAGES", false);

  // Don't render shared section if feature flag is disabled
  if (sectionType === "shared" && !isSharedPagesEnabled) {
    return null;
  }

  // Custom hooks
  const { isDropping } = useSectionDragAndDrop(listSectionRef, getPageById, sectionType);
  const { isLoading } = useSectionPages(sectionType);

  // Get page IDs based on section type
  const pageIds = useMemo(() => {
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

  const sectionDetails = SECTION_DETAILS[sectionType];
  const sectionPages = useMemo(() => new Set(pageIds), [pageIds]);

  // Check if section contains the active page or its ancestors
  const sectionContainsActivePage = useMemo(() => {
    if (!currentPageId) return false;

    const currentPage = getPageById(currentPageId);

    // Direct match
    if (sectionPages.has(currentPageId)) return true;

    // Check ancestors
    if (!currentPage?.parent_id) return false;

    let parentId: string | null | undefined = currentPage.parent_id;
    while (parentId) {
      const parent = getPageById(parentId);
      if (!parent?.id) break;

      if (sectionPages.has(parent.id)) return true;
      parentId = parent.parent_id;
    }

    return false;
  }, [currentPageId, sectionPages, getPageById]);

  // Determine if section should be open by default
  const defaultOpen = useMemo(() => {
    // If section contains active page, open it
    if (sectionContainsActivePage) return true;

    // Open public, private, and shared sections by default (not archived)
    return sectionType === "public" || sectionType === "private" || sectionType === "shared";
  }, [sectionContainsActivePage, sectionType]);

  // Show loader if loading and no cached data
  const showLoader = isLoading && pageIds.length === 0;

  // Handle page creation
  const handleCreatePage = async (pageType: TPageNavigationTabs) => {
    setIsCreatingPage(pageType);
    const payload: Partial<TPage> = {
      access: pageType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC,
    };

    try {
      const res = await createPage(payload);
      captureSuccess({
        eventName: WORKSPACE_PAGE_TRACKER_EVENTS.create,
        payload: {
          id: res?.id,
          state: "SUCCESS",
        },
      });
      const pageId = `/${workspaceSlug}/pages/${res?.id}`;
      router.push(pageId);
    } catch (err: any) {
      captureError({
        eventName: WORKSPACE_PAGE_TRACKER_EVENTS.create,
        payload: {
          state: "ERROR",
        },
      });
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: err?.data?.error || "Page could not be created. Please try again.",
      });
    } finally {
      setIsCreatingPage(null);
    }
  };

  // Expand parent pages when needed
  useEffect(() => {
    if (!currentPageId || !setExpandedPageIds || !sectionContainsActivePage) return;

    const currentPage = getPageById(currentPageId);
    if (!currentPage) return;

    const parentIds: string[] = [];
    let parentPage = currentPage;

    while (parentPage.parent_id) {
      parentIds.push(parentPage.parent_id);
      const nextParent = getPageById(parentPage.parent_id);
      if (!nextParent) break;
      parentPage = nextParent;
    }

    if (parentIds.length === 0) return;

    setExpandedPageIds((prev) => {
      const expandedSet = new Set(prev);
      let hasChanges = false;

      parentIds.forEach((id) => {
        if (!expandedSet.has(id)) {
          expandedSet.add(id);
          hasChanges = true;
        }
      });

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
      <Disclosure defaultOpen={defaultOpen}>
        {({ open }) => (
          <>
            <SectionHeader
              sectionType={sectionType}
              sectionDetails={sectionDetails}
              isCreatingPage={isCreatingPage}
              handleCreatePage={handleCreatePage}
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
                  pageIds={pageIds}
                  sectionType={sectionType}
                  expandedPageIds={expandedPageIds}
                  setExpandedPageIds={setExpandedPageIds}
                />
              )}
            </Transition>
          </>
        )}
      </Disclosure>
    </div>
  );
});

export const WikiSidebarListSectionRoot = memo(WikiSidebarListSectionRootContent);
