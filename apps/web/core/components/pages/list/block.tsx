"use client";

import { FC, useCallback, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronRight, FileText, Loader } from "lucide-react";
import { TPageNavigationTabs } from "@plane/types";
// plane imports
import { Logo, RestrictedPageIcon, setToast, TOAST_TYPE } from "@plane/ui";
import { cn, getPageName } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
import { BlockItemAction } from "@/components/pages/list";
// helpers
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import { EPageStoreType, usePage, usePageStore } from "@/plane-web/hooks/store";

type TPageListBlock = {
  handleToggleExpanded: () => void;
  isExpanded: boolean;
  paddingLeft: number;
  pageId: string;
  storeType: EPageStoreType;
  pageType?: TPageNavigationTabs;
};

export const PageListBlock: FC<TPageListBlock> = observer((props) => {
  const { handleToggleExpanded, isExpanded, paddingLeft, pageId, storeType, pageType } = props;
  // states
  const [isFetchingSubPages, setIsFetchingSubPages] = useState(false);
  // refs
  const parentRef = useRef(null);
  // hooks
  const router = useAppRouter();
  const page = usePage({
    pageId,
    storeType,
  });
  const { isMobile } = usePlatformOS();
  // handle page check
  // derived values
  const { workspaceSlug } = useParams();
  const { isNestedPagesEnabled } = usePageStore(storeType);
  const isNestedPagesDisabledForPage = useMemo(
    () => !isNestedPagesEnabled(workspaceSlug?.toString()) && page?.parent_id,
    [isNestedPagesEnabled, workspaceSlug, page?.parent_id]
  );

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
  const pageTitle = !isNestedPagesDisabledForPage ? getPageName(name) : `Page upgrade to view page`;

  if (deleted_at) {
    return null;
  }

  return (
    <div ref={parentRef} className="relative">
      <ListItem
        title={
          isNestedPagesDisabledForPage
            ? "Please upgrade to view page"
            : canCurrentUserAccessPage
              ? pageTitle
              : "Restricted Access"
        }
        itemLink={getRedirectionLink?.()}
        onItemClick={() => router.push(getRedirectionLink?.() ?? "")}
        leftElementClassName="gap-2"
        prependTitleElement={
          <div
            className="flex-shrink-0 flex items-center gap-1"
            style={{
              paddingLeft: `${paddingLeft}px`,
            }}
          >
            {shouldShowSubPagesButton ? (
              <button
                type="button"
                className="flex-shrink-0 size-5 grid place-items-center rounded-sm text-custom-text-400 hover:text-custom-text-300"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleSubPagesToggle();
                }}
                disabled={isFetchingSubPages}
                data-prevent-progress
              >
                {isFetchingSubPages ? (
                  <Loader className="size-4 animate-spin" />
                ) : (
                  <ChevronRight
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
            <div className="flex-shrink-0 size-6 grid place-items-center">
              {canCurrentUserAccessPage && !isNestedPagesDisabledForPage ? (
                logo_props?.in_use ? (
                  <Logo logo={logo_props} size={16} type="lucide" />
                ) : (
                  <FileText className="size-4 text-custom-text-300" />
                )
              ) : (
                <RestrictedPageIcon className="size-4 text-custom-text-300 mb-1" />
              )}
            </div>
          </div>
        }
        actionableItems={
          !isNestedPagesDisabledForPage ? (
            <BlockItemAction page={page} parentRef={parentRef} storeType={storeType} />
          ) : undefined
        }
        isMobile={isMobile}
        parentRef={parentRef}
      />
    </div>
  );
});
