"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// plane types
import { TPageNavigationTabs } from "@plane/types";
// plane web hooks
import { EPageStoreType, usePage } from "@/plane-web/hooks/store";
// local components
import { PageListBlock } from "./block";

type TPageListBlock = {
  paddingLeft: number;
  pageId: string;
  storeType: EPageStoreType;
  pageType?: TPageNavigationTabs;
};

export const PageListBlockRoot: React.FC<TPageListBlock> = observer((props) => {
  const { paddingLeft, pageId, storeType, pageType } = props;
  // states
  const [isExpanded, setIsExpanded] = useState(false);
  // store hooks
  const page = usePage({
    pageId,
    storeType,
  });
  // derived values
  const { sub_pages_count, subPageIds } = page ?? {};
  const shouldShowSubPages = isExpanded && sub_pages_count !== undefined && sub_pages_count > 0;

  return (
    <>
      <PageListBlock
        handleToggleExpanded={() => setIsExpanded((prev) => !prev)}
        isExpanded={isExpanded}
        paddingLeft={paddingLeft}
        pageId={pageId}
        storeType={storeType}
        pageType={pageType}
      />
      {shouldShowSubPages &&
        subPageIds?.map((pageId) => (
          <PageListBlockRoot
            key={pageId}
            paddingLeft={paddingLeft + 26}
            pageId={pageId}
            storeType={storeType}
            pageType={pageType}
          />
        ))}
    </>
  );
});
