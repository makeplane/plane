"use client";

import { useState, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { ArchiveIcon, ChevronRight, FileText, Loader } from "lucide-react";
// plane imports
import { ControlLink, EmptyPageIcon, RestrictedPageIcon, setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
// components
import { Logo } from "@/components/common";
// helpers
import { cn } from "@/helpers/common.helper";
import { getPageName } from "@/helpers/page.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import { EPageStoreType, usePage, usePageStore } from "@/plane-web/hooks/store";

type Props = {
  handleToggleExpanded: () => void;
  isDragging: boolean;
  isExpanded: boolean;
  paddingLeft: number;
  pageId: string;
};

export const WikiPageSidebarListItem: React.FC<Props> = observer((props) => {
  const { handleToggleExpanded, isDragging, isExpanded, paddingLeft, pageId } = props;
  // states
  const [isFetchingSubPages, setIsFetchingSubPages] = useState(false);
  // navigation
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // router
  const router = useAppRouter();
  // store hooks
  const { sidebarCollapsed: isCollapsed } = useAppTheme();
  const { isMobile } = usePlatformOS();
  // derived values
  const page = usePage({
    pageId,
    storeType: EPageStoreType.WORKSPACE,
  });
  const { isNestedPagesEnabled } = usePageStore(EPageStoreType.WORKSPACE);
  const {
    fetchSubPages,
    is_description_empty,
    getRedirectionLink,
    sub_pages_count,
    archived_at,
    canCurrentUserAccessPage,
    logo_props,
  } = page ?? {};

  const isNestedPagesDisabledForPage = useMemo(
    () => !isNestedPagesEnabled(workspaceSlug?.toString()) && page?.parent_id,
    [isNestedPagesEnabled, workspaceSlug, page?.parent_id]
  );
  // Function to determine the appropriate logo to display
  const pageEmbedLogo = useMemo(() => {
    if (!canCurrentUserAccessPage || isNestedPagesDisabledForPage) {
      return <RestrictedPageIcon className="size-3.5" />;
    }
    if (logo_props?.in_use) {
      return <Logo logo={logo_props} size={14} type="lucide" />;
    }
    if (!is_description_empty) {
      return <FileText className="size-3.5" />;
    }
    return <EmptyPageIcon className="size-3.5" />;
  }, [logo_props, is_description_empty, canCurrentUserAccessPage, isNestedPagesDisabledForPage]);

  const isPageActive = pathname === `/${workspaceSlug}/pages/${page?.id}/`;
  const pageLink = getRedirectionLink?.() ?? "";
  const shouldShowSubPagesButton = sub_pages_count !== undefined && sub_pages_count > 0;

  const handleSubPagesToggle = async () => {
    handleToggleExpanded();
    setIsFetchingSubPages(true);
    try {
      if (!isExpanded) {
        await fetchSubPages?.();
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
  };

  if (!page) return null;

  return (
    <Tooltip tooltipContent={page.name} position="right" disabled={!isCollapsed} isMobile={isMobile}>
      <ControlLink
        className={cn(
          "group w-full flex items-center justify-between gap-1 py-1.5 pr-1 rounded-md text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90",
          {
            "justify-center": isCollapsed,
            "bg-custom-primary-100/10 hover:bg-custom-primary-100/10 text-custom-primary-100": isPageActive,
          }
        )}
        disabled={isPageActive || !canCurrentUserAccessPage}
        href={pageLink}
        onClick={() => {
          router.push(pageLink);
        }}
        target="_self"
      >
        <div
          className="flex items-center gap-1 truncate"
          style={{
            paddingLeft: `${paddingLeft + 4}px`,
          }}
        >
          <div className="size-4 flex-shrink-0 grid place-items-center">
            <span
              className={cn("grid place-items-center", {
                "group-hover:hidden": shouldShowSubPagesButton,
              })}
            >
              {pageEmbedLogo}
            </span>

            {shouldShowSubPagesButton && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleSubPagesToggle();
                }}
                className={cn(
                  "rounded hover:bg-custom-background-80 hidden group-hover:grid place-items-center transition-opacity"
                )}
                data-prevent-NProgress
              >
                {isFetchingSubPages ? (
                  <Loader className="size-3.5 animate-spin" />
                ) : (
                  <ChevronRight
                    className={cn("size-3.5 transform transition-transform duration-300 ease-in-out", {
                      "rotate-90": isExpanded,
                    })}
                    strokeWidth={2.5}
                  />
                )}
              </button>
            )}
          </div>
          {!isNestedPagesDisabledForPage ? (
            <p className="truncate text-sm">
              {canCurrentUserAccessPage ? getPageName(page.name) : `Restricted Access`}
            </p>
          ) : (
            <p className="truncate text-sm">{"Please upgrade to view"}</p>
          )}
        </div>
        {archived_at && (
          <div className="flex-shrink-0 size-4 grid place-items-center">
            <ArchiveIcon className="size-3.5 text-custom-text-300" />
          </div>
        )}
      </ControlLink>
    </Tooltip>
  );
});
