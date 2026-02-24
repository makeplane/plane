/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Loader } from "lucide-react";
// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronRightIcon, PageIcon, RestrictedPageIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TPageNavigationTabs } from "@plane/types";
import { cn, getPageName } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
import { BlockItemAction } from "@/components/pages/list/block-item-action";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { usePage, usePageStore } from "@/plane-web/hooks/store";

type TPageListBlock = {
  handleToggleExpanded: () => void;
  isExpanded: boolean;
  isDropping: boolean;
  paddingLeft: number;
  pageId: string;
  storeType: EPageStoreType;
  pageType?: TPageNavigationTabs;
  isDragging?: boolean;
  isHovered?: boolean;
  canShowAddButton?: boolean;
};

export const PageListBlock = observer(function PageListBlock(props: TPageListBlock) {
  const {
    handleToggleExpanded,
    isExpanded,
    paddingLeft,
    pageId,
    storeType,
    isDragging = false,
    isDropping = false,
  } = props;
  // states
  const [isFetchingSubPages, setIsFetchingSubPages] = useState(false);
  // refs
  const parentRef = useRef(null);
  // params
  const { workspaceSlug } = useParams();
  // hooks
  const router = useAppRouter();
  const page = usePage({
    pageId,
    storeType,
  });
  const { isMobile } = usePlatformOS();
  // handle page check
  const { isNestedPagesEnabled: getIsNestedPagesEnabled } = usePageStore(storeType);
  // derived values
  const isNestedPagesEnabled = getIsNestedPagesEnabled(workspaceSlug);
  const shouldHideActions = !isNestedPagesEnabled && page?.parent_id;

  const handleSubPagesToggle = useCallback(async () => {
    handleToggleExpanded();
    setIsFetchingSubPages(true);
    try {
      if (!isExpanded) {
        await page?.fetchSubPages?.();
      }
    } catch {
      handleToggleExpanded();
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to fetch sub-pages. Please try again.",
      });
    } finally {
      setIsFetchingSubPages(false);
    }
  }, [isExpanded, page, handleToggleExpanded]);

  if (!page) return null;

  const { name, logo_props, getRedirectionLink, sub_pages_count, deleted_at, canCurrentUserAccessPage } = page;

  const shouldShowSubPagesButton = sub_pages_count !== undefined && sub_pages_count > 0;

  if (deleted_at) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className={cn("relative", {
        "opacity-50": isDragging,
      })}
    >
      <ListItem
        title={canCurrentUserAccessPage ? getPageName(name) : "Restricted Access"}
        itemLink={getRedirectionLink?.()}
        onItemClick={() => router.push(getRedirectionLink?.() ?? "")}
        leftElementClassName="gap-2"
        className={cn("outline-none transition-colors", {
          "is-dragging": isDropping,
        })}
        prependTitleElement={
          <div
            className="shrink-0 flex items-center gap-1"
            style={{
              paddingLeft: `${paddingLeft}px`,
            }}
          >
            {shouldShowSubPagesButton ? (
              <button
                type="button"
                className="shrink-0 size-5 grid place-items-center rounded-sm text-placeholder hover:text-tertiary"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  void handleSubPagesToggle();
                }}
                disabled={isFetchingSubPages}
                data-prevent-progress
              >
                {isFetchingSubPages ? (
                  <Loader className="size-4 animate-spin" />
                ) : (
                  <ChevronRightIcon
                    className={cn("size-4", {
                      "rotate-90": isExpanded,
                    })}
                    strokeWidth={2.5}
                  />
                )}
              </button>
            ) : (
              <span className="size-5" />
            )}
            <div className="shrink-0 size-6 grid place-items-center">
              {canCurrentUserAccessPage ? (
                logo_props?.in_use ? (
                  <Logo logo={logo_props} size={16} type="lucide" />
                ) : (
                  <PageIcon className="size-4 text-tertiary" />
                )
              ) : (
                <RestrictedPageIcon className="size-4 text-tertiary mb-1" />
              )}
            </div>
          </div>
        }
        actionableItems={
          shouldHideActions ? undefined : <BlockItemAction page={page} parentRef={parentRef} storeType={storeType} />
        }
        isMobile={isMobile}
        parentRef={parentRef}
      />
    </div>
  );
});
