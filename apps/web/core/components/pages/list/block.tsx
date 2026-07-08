/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon } from "@plane/propel/icons";
// plane imports
import { cn, getPageName } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
import { BlockItemAction } from "@/components/pages/list/block-item-action";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import type { EPageStoreType } from "@/hooks/store";
import { usePage, usePageStore } from "@/hooks/store";

type TPageListBlock = {
  pageId: string;
  storeType: EPageStoreType;
  level?: number;
};

export const PageListBlock = observer(function PageListBlockItem(props: TPageListBlock) {
  const { pageId, storeType, level = 0 } = props;
  // states
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFetchingSubPages, setIsFetchingSubPages] = useState(false);
  // refs
  const parentRef = useRef(null);
  // params
  const { workspaceSlug, projectId } = useParams();
  // hooks
  const page = usePage({
    pageId,
    storeType,
  });
  const { fetchSubPages, getSubPageIds, getPageById } = usePageStore(storeType);
  const { isMobile } = usePlatformOS();
  // derived values
  const subPageIds = getSubPageIds(pageId);
  // handle page check
  if (!page) return null;
  // Only show sub-pages sharing the parent's archived state, so an archived
  // sub-page never renders under an active parent (and vice versa).
  const parentArchived = !!page.archived_at;
  const visibleSubPageIds = subPageIds?.filter((subPageId) => {
    const subPage = getPageById(subPageId);
    return subPage ? !!subPage.archived_at === parentArchived : true;
  });
  // derived values
  const { name, logo_props, getRedirectionLink } = page;

  const handleToggleExpanded = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    setIsExpanded(true);
    if (!subPageIds && workspaceSlug && projectId) {
      setIsFetchingSubPages(true);
      fetchSubPages(workspaceSlug.toString(), projectId.toString(), pageId)
        .catch(() => setIsExpanded(false))
        .finally(() => setIsFetchingSubPages(false));
    }
  };

  return (
    <>
      <ListItem
        prependTitleElement={
          <>
            <button
              type="button"
              onClick={handleToggleExpanded}
              aria-label={isExpanded ? "Collapse sub-pages" : "Expand sub-pages"}
              className="grid flex-shrink-0 place-items-center rounded p-0.5 hover:bg-layer-transparent-hover"
            >
              <ChevronRight
                className={cn("h-3.5 w-3.5 text-tertiary transition-transform", { "rotate-90": isExpanded })}
              />
            </button>
            {logo_props?.in_use ? (
              <Logo logo={logo_props} size={16} type="lucide" />
            ) : (
              <PageIcon className="h-4 w-4 text-tertiary" />
            )}
          </>
        }
        title={getPageName(name)}
        itemLink={getRedirectionLink()}
        actionableItems={<BlockItemAction page={page} parentRef={parentRef} storeType={storeType} />}
        isMobile={isMobile}
        parentRef={parentRef}
      />
      {isExpanded && (
        <div className="pl-6">
          {isFetchingSubPages && <p className="px-3 py-2 text-13 text-tertiary">Loading sub-pages...</p>}
          {!isFetchingSubPages && visibleSubPageIds?.length === 0 && (
            <p className="px-3 py-2 text-13 text-tertiary">No sub-pages</p>
          )}
          {!isFetchingSubPages &&
            visibleSubPageIds?.map((subPageId) => (
              <PageListBlock key={subPageId} pageId={subPageId} storeType={storeType} level={level + 1} />
            ))}
        </div>
      )}
    </>
  );
});
