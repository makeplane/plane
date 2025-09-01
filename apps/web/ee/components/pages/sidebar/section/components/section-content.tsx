import React, { memo } from "react";
import { useParams } from "next/navigation";
import { Loader } from "lucide-react";
import { Disclosure } from "@headlessui/react";
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
import { WikiPageSidebarListItemRoot } from "../../list-item-root";
import { SectionContentProps } from "../types";

/**
 * Component for rendering section content with virtualization
 * Only renders items that are visible in the viewport (with buffer)
 */
const VirtualizedSectionContentComponent: React.FC<SectionContentProps> = ({
  pageIds,
  sectionType,
  expandedPageIds,
  setExpandedPageIds,
}) => {
  // Get current page ID to ensure it's always rendered
  const { pageId: currentPageId } = useParams();

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

  return (
    <Disclosure.Panel as="div" className="ml-1 mt-2">
      {pageIds.length > 0 ? (
        <div>
          {pageIds.map((pageId) => {
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
};

export const SectionContent = memo(VirtualizedSectionContentComponent);
