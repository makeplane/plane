"use client";

import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { TPageNavigationTabs } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store";
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
  // store hooks
  const { sidebarCollapsed } = useAppTheme();

  // derived values
  const isCollapsed = !!sidebarCollapsed;
  const sectionsList: TPageNavigationTabs[] = ["public", "private", "archived"];
  // Current page ID (without UUID validation to keep it simple)
  const currentPageId = pageId ? pageId.toString() : undefined;

  return (
    <div
      className={cn("vertical-scrollbar h-full space-y-4 !overflow-y-scroll scrollbar-sm -mr-3 -ml-4 pl-4", {
        "space-y-0": isCollapsed,
      })}
    >
      {Object.values(sectionsList).map((section) => (
        <WikiSidebarListSectionRoot
          key={section}
          expandedPageIds={expandedPageIds}
          setExpandedPageIds={setExpandedPageIds}
          sectionType={section}
          currentPageId={currentPageId}
        />
      ))}
    </div>
  );
});
