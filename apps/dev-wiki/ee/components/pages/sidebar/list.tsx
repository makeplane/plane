"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { TPageNavigationTabs } from "@plane/types";
// local imports
import { WikiSidebarListSectionRoot } from "./section/section-root";

type Props = {
  expandedPageIds?: string[];
  setExpandedPageIds?: React.Dispatch<React.SetStateAction<string[]>>;
};

export const PagesAppSidebarList: React.FC<Props> = observer((props) => {
  const { expandedPageIds = [], setExpandedPageIds } = props;
  // params
  const { pageId } = useParams();

  // derived values
  const sectionsList: TPageNavigationTabs[] = ["public", "shared", "private", "archived"];
  // Current page ID (without UUID validation to keep it simple)
  const currentPageId = pageId ? pageId.toString() : undefined;

  return (
    <div className="vertical-scrollbar h-full !overflow-y-scroll scrollbar-sm -mr-3 -ml-4 pl-4">
      {Object.values(sectionsList).map((section) => (
        <WikiSidebarListSectionRoot
          key={section}
          currentPageId={currentPageId}
          expandedPageIds={expandedPageIds}
          sectionType={section}
          setExpandedPageIds={setExpandedPageIds}
        />
      ))}
    </div>
  );
});
