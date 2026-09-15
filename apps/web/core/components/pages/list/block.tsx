/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef } from "react";
import { observer } from "mobx-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronRightIcon, PageIcon } from "@plane/propel/icons";
// plane imports
import { cn, getPageName } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
import { BlockItemAction } from "@/components/pages/list/block-item-action";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import type { EPageStoreType } from "@/hooks/store";
import { usePage } from "@/hooks/store";

type TPageListBlock = {
  pageId: string;
  storeType: EPageStoreType;
  // tree props, omitted for flat lists
  depth?: number;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
};

export const PageListBlock = observer(function PageListBlock(props: TPageListBlock) {
  const { pageId, storeType, depth, hasChildren = false, isExpanded = false, onToggleExpand } = props;
  // refs
  const parentRef = useRef(null);
  // hooks
  const page = usePage({
    pageId,
    storeType,
  });
  const { isMobile } = usePlatformOS();
  // handle page check
  if (!page) return null;
  // derived values
  const { name, logo_props, getRedirectionLink } = page;
  const isTreeItem = depth !== undefined;

  return (
    <ListItem
      prependTitleElement={
        <div className="flex items-center gap-2" style={isTreeItem ? { paddingLeft: `${depth * 20}px` } : undefined}>
          {isTreeItem && (
            <button
              type="button"
              className={cn("grid size-5 place-items-center rounded-sm text-tertiary hover:bg-layer-1", {
                invisible: !hasChildren,
              })}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleExpand?.();
              }}
              aria-label={isExpanded ? "Collapse sub-pages" : "Expand sub-pages"}
              tabIndex={hasChildren ? 0 : -1}
            >
              <ChevronRightIcon className={cn("size-3.5 transition-transform", { "rotate-90": isExpanded })} />
            </button>
          )}
          {logo_props?.in_use ? (
            <Logo logo={logo_props} size={16} type="lucide" />
          ) : (
            <PageIcon className="h-4 w-4 text-tertiary" />
          )}
        </div>
      }
      title={getPageName(name)}
      itemLink={getRedirectionLink()}
      actionableItems={<BlockItemAction page={page} parentRef={parentRef} storeType={storeType} />}
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
