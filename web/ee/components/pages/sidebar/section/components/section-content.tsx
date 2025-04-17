import React from "react";
import { Disclosure } from "@headlessui/react";
import { cn } from "@plane/utils";
import { WikiPageSidebarListItemRoot } from "../../list-item-root";
import { SectionContentProps } from "../types";

/**
 * Component for rendering section content including page items
 */
export const SectionContent: React.FC<SectionContentProps> = ({
  isCollapsed,
  pageIds,
  sectionType,
  expandedPageIds,
  setExpandedPageIds,
}) => (
  <Disclosure.Panel
    as="div"
    className={cn("ml-1 mt-2", {
      hidden: isCollapsed,
    })}
  >
    {pageIds.length > 0 ? (
      pageIds.map((pageId) => (
        <WikiPageSidebarListItemRoot
          key={pageId}
          paddingLeft={0}
          pageId={pageId}
          expandedPageIds={expandedPageIds}
          setExpandedPageIds={setExpandedPageIds}
        />
      ))
    ) : (
      <p className="text-custom-text-400 text-xs text-center font-medium ml-1 mt-2">No {sectionType} pages</p>
    )}
  </Disclosure.Panel>
);
