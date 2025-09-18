import React, { memo, useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Loader } from "lucide-react";
import { Disclosure } from "@headlessui/react";
// plane imports
import { EPageAccess, PAGE_SORT_ORDER_INCREMENT } from "@plane/constants";
import type { TPage } from "@plane/types";
// components
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
// plane web imports
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store/use-page-store";
// local imports
import { WikiPageSidebarListItemRoot } from "../../list-item-root";
import { SectionContentProps } from "../types";

/**
 * Component for rendering section content with virtualization
 * Only renders items that are visible in the viewport (with buffer)
 */
const VirtualizedSectionContentComponent: React.FC<SectionContentProps> = observer(
  ({ pageIds, sectionType, expandedPageIds, setExpandedPageIds }) => {
    // Get current page ID to ensure it's always rendered
    const { pageId: currentPageId } = useParams();
    // store hooks
    const { getPageById } = usePageStore(EPageStoreType.WORKSPACE);

    // Placeholder for items not currently visible
    const renderPlaceholder = () => (
      <div className="flex items-center px-2 text-custom-text-200" style={{ height: "30px" }}>
        <Loader className="size-3 mr-2 animate-spin opacity-30" />
        <div className="h-2 bg-custom-background-80 rounded w-3/4 opacity-20" />
      </div>
    );

    // Check if this page or any of its ancestors is the current page
    const isActiveOrAncestor = (pageId: string) => {
      if (!currentPageId) return false;

      // Direct match
      if (pageId === currentPageId.toString()) return true;

      // Check if it's an ancestor of current page (is expanded and in expanded path)
      if (expandedPageIds && expandedPageIds.includes(pageId)) {
        // This relies on the existing logic in section-root that expands parent pages
        // of the current page, so if a page is both expanded and the current page exists,
        // there's a good chance it's in the ancestry path
        return true;
      }

      return false;
    };

    const handleReorderPages = useCallback(
      (pageId: string, targetId: string, position: "before" | "after") => {
        const shouldDropAtEnd = position === "after";
        const sourcePage = getPageById(pageId);
        const sourcePageCurrentIndex = pageIds.indexOf(pageId);
        const destinationIndex = shouldDropAtEnd ? pageIds.length - 1 : pageIds.indexOf(targetId);

        let sortOrder = sourcePage?.sort_order ?? 65535;
        if (sourcePageCurrentIndex !== destinationIndex) {
          if (destinationIndex === 0) {
            const page = getPageById(pageIds[destinationIndex]);
            if (page && page.sort_order !== undefined) {
              sortOrder = page.sort_order - PAGE_SORT_ORDER_INCREMENT;
            }
          } else if (destinationIndex === pageIds.length - 1) {
            const page = getPageById(pageIds[destinationIndex]);
            if (page && page.sort_order !== undefined) {
              sortOrder = page.sort_order + PAGE_SORT_ORDER_INCREMENT;
            }
          } else {
            const page = getPageById(pageIds[destinationIndex - 1]);
            const nextPage = getPageById(pageIds[destinationIndex]);
            if (page && nextPage && page.sort_order !== undefined && nextPage.sort_order !== undefined) {
              sortOrder = (page.sort_order + nextPage.sort_order) / 2;
            }
          }
        }

        const payload: Partial<TPage> = {};

        if (sortOrder !== sourcePage?.sort_order) {
          payload.sort_order = sortOrder;
        }

        // TODO: remove parent id patch once reordering is implemented for sub-pages
        if (sourcePage?.parent_id !== null) {
          payload.parent_id = null;
        }

        let newAccess: EPageAccess | undefined;
        if (sectionType === "public") {
          newAccess = EPageAccess.PUBLIC;
        } else if (sectionType === "private") {
          newAccess = EPageAccess.PRIVATE;
        }

        if (newAccess !== undefined && sourcePage?.access !== newAccess) {
          payload.access = newAccess;
          // If we're setting access to public/private, unset the shared flag
          payload.is_shared = false;
        }

        if (Object.keys(payload).length > 0) {
          sourcePage?.update(payload);
        }
      },
      [getPageById, pageIds, sectionType]
    );

    return (
      <Disclosure.Panel as="div" className="ml-1 mt-2 pb-4">
        {pageIds.length > 0 ? (
          <div>
            {pageIds.map((pageId, index) => {
              // If this is the active page or an ancestor, always render it
              // without virtualization to ensure it's available for scrolling
              const isImportantPage = isActiveOrAncestor(pageId);

              return isImportantPage ? (
                <div key={pageId} className="w-full" data-active-page-or-ancestor="true">
                  <WikiPageSidebarListItemRoot
                    paddingLeft={0}
                    pageId={pageId}
                    expandedPageIds={expandedPageIds}
                    setExpandedPageIds={setExpandedPageIds}
                    sectionType={sectionType}
                    isLastChild={index === pageIds.length - 1}
                    handleReorderPages={handleReorderPages}
                  />
                </div>
              ) : (
                <RenderIfVisible
                  key={pageId}
                  verticalOffset={200}
                  horizontalOffset={0}
                  defaultHeight="30px"
                  placeholderChildren={renderPlaceholder()}
                  shouldRecordHeights={false}
                  defaultValue={false}
                  classNames="w-full"
                >
                  <WikiPageSidebarListItemRoot
                    paddingLeft={0}
                    pageId={pageId}
                    expandedPageIds={expandedPageIds}
                    setExpandedPageIds={setExpandedPageIds}
                    sectionType={sectionType}
                    isLastChild={index === pageIds.length - 1}
                    handleReorderPages={handleReorderPages}
                  />
                </RenderIfVisible>
              );
            })}
          </div>
        ) : (
          <p className="text-custom-text-400 text-xs text-center font-medium ml-1 mt-2">No {sectionType} pages</p>
        )}
      </Disclosure.Panel>
    );
  }
);

export const SectionContent = memo(VirtualizedSectionContentComponent);
