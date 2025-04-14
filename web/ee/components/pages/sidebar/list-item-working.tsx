"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { ChevronRight, FileText, Loader } from "lucide-react";
// plane imports
import { ControlLink, setToast, TOAST_TYPE, Tooltip, ArchiveIcon, RestrictedPageIcon } from "@plane/ui";
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
import { EPageStoreType, usePage } from "@/plane-web/hooks/store";

type Props = {
  handleToggleExpanded: () => void;
  isExpanded: boolean;
  paddingLeft: number;
  pageId: string;
};

export const WikiPageSidebarListItem: React.FC<Props> = observer((props) => {
  const { handleToggleExpanded, isExpanded, paddingLeft, pageId } = props;
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
  const { fetchSubPages, getRedirectionLink, sub_pages_count, canCurrentUserAccessPage } = page ?? {};
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
    } catch (error) {
      console.error("Error", error);
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

  if (!page || page.deleted_at) return null;

  return (
    <Tooltip tooltipContent={page.name} position="right" disabled={!isCollapsed} isMobile={isMobile}>
      <ControlLink
        className={cn(
          "w-full flex items-center gap-1 py-1.5 pr-1 rounded-md text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90",
          {
            "justify-center": isCollapsed,
            "bg-custom-primary-100/10 hover:bg-custom-primary-100/10 text-custom-primary-100": isPageActive,
          }
        )}
        // disabled={isPageActive}
        style={{
          paddingLeft: `${paddingLeft + 4}px`,
        }}
        href={pageLink}
        onClick={() => router.push(pageLink)}
        target="_self"
      >
        {shouldShowSubPagesButton ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleSubPagesToggle();
            }}
            className="size-4 flex-shrink-0 grid place-items-center rounded hover:bg-custom-background-80"
            data-prevent-NProgress
          >
            {isFetchingSubPages ? (
              <Loader className="size-3.5 animate-spin" />
            ) : (
              <ChevronRight
                className={cn("size-3.5", {
                  "rotate-90": isExpanded,
                })}
                strokeWidth={2.5}
              />
            )}
          </button>
        ) : (
          <span className="size-4 flex-shrink-0 grid place-items-center">
            {page.logo_props?.in_use ? (
              <Logo logo={page.logo_props} size={14} type="lucide" />
            ) : (
              <FileText className="size-3.5" />
            )}
          </span>
        )}
        {!isCollapsed && (
          <p className="truncate text-sm">{!canCurrentUserAccessPage ? getPageName(page.name) : `Restricted Access`}</p>
        )}
        {!canCurrentUserAccessPage && (
          <div className="flex-shrink-0 size-4 grid place-items-center">
            <RestrictedPageIcon className="size-3.5 text-custom-text-300" />
          </div>
        )}
        {page.archived_at && (
          <div className="flex-shrink-0 size-4 grid place-items-center">
            <ArchiveIcon className="size-3.5 text-custom-text-300" />
          </div>
        )}
      </ControlLink>
    </Tooltip>
  );
});
