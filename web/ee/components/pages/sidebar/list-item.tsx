"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useRouter } from "next/navigation";
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
  isHovered?: boolean;
  canShowAddButton?: boolean;
};

const WikiPageSidebarListItemComponent = observer((props: Props) => {
  const { handleToggleExpanded, isDragging, isExpanded, paddingLeft, pageId, isHovered, canShowAddButton } = props;
  // states
  const [isFetchingSubPages, setIsFetchingSubPages] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  // navigation
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // router
  const router = useRouter();
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
    description_html,
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

  const isDescriptionEmpty = useMemo(
    () => is_description_empty || description_html === "<p></p>",
    [is_description_empty, description_html]
  );

  // Function to determine the appropriate logo to display
  const pageEmbedLogo = useMemo(() => {
    if (!canCurrentUserAccessPage || isNestedPagesDisabledForPage) {
      return <RestrictedPageIcon className="size-3.5" />;
    }
    if (logo_props?.in_use) {
      return <Logo logo={logo_props} size={14} type="lucide" />;
    }
    if (!isDescriptionEmpty) {
      return <FileText className="size-3.5" />;
    }
    return <EmptyPageIcon className="size-3.5" />;
  }, [logo_props, isDescriptionEmpty, canCurrentUserAccessPage, isNestedPagesDisabledForPage]);

  const isPageActive = useMemo(
    () => pathname === `/${workspaceSlug}/pages/${page?.id}/`,
    [pathname, workspaceSlug, page?.id]
  );

  const pageLink = useMemo(() => getRedirectionLink?.() ?? "", [getRedirectionLink]);

  const shouldShowSubPagesButton = useMemo(
    () => sub_pages_count !== undefined && sub_pages_count > 0,
    [sub_pages_count]
  );

  const showAddButton = isHovered && canShowAddButton;

  // Memoize event handlers to prevent recreation
  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);
  const handleNavigate = useCallback(() => {
    router.push(pageLink);
  }, [router, pageLink]);

  const handleSubPagesToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleToggleExpanded();

      // Only fetch if expanding
      if (!isExpanded) {
        setIsFetchingSubPages(true);
        try {
          await fetchSubPages?.();
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Failed to fetch sub-pages. Please try again.",
          });
        } finally {
          setIsFetchingSubPages(false);
        }
      }
    },
    [handleToggleExpanded, isExpanded, fetchSubPages]
  );

  // Memoize class names
  const linkClassName = useMemo(
    () =>
      cn(
        "group w-full flex items-center justify-between gap-1 py-1.5 rounded-md text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90",
        {
          "justify-center": isCollapsed,
          "bg-custom-primary-100/10 hover:bg-custom-primary-100/10 text-custom-primary-100 font-medium": isPageActive,
        }
      ),
    [isCollapsed, isPageActive]
  );

  const contentContainerClassName = useMemo(
    () =>
      cn("flex items-center gap-1 truncate", {
        "max-w-[calc(100%-28px)] pr-3": showAddButton,
        "w-full pr-1": !showAddButton,
      }),
    [showAddButton]
  );

  const contentStyle = useMemo(() => ({ paddingLeft: `${paddingLeft + 4}px` }), [paddingLeft]);

  const chevronClassName = useMemo(
    () =>
      cn("size-3.5 transform transition-transform duration-300 ease-in-out", {
        "rotate-90": isExpanded,
      }),
    [isExpanded]
  );

  if (!page) return null;

  return (
    <Tooltip tooltipContent={page.name} position="right" disabled={!isCollapsed} isMobile={isMobile}>
      <ControlLink
        className={linkClassName}
        disabled={isPageActive || !canCurrentUserAccessPage}
        href={pageLink}
        onClick={handleNavigate}
        target="_self"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={contentContainerClassName} style={contentStyle}>
          <div className="size-4 flex-shrink-0 grid place-items-center">
            {shouldShowSubPagesButton && isHovering ? (
              <button
                type="button"
                onClick={handleSubPagesToggle}
                className="rounded hover:bg-custom-background-80 grid place-items-center"
                data-prevent-NProgress
              >
                {isFetchingSubPages ? (
                  <Loader className="size-3.5 animate-spin" />
                ) : (
                  <ChevronRight className={chevronClassName} strokeWidth={2.5} />
                )}
              </button>
            ) : (
              <span className="grid place-items-center">{pageEmbedLogo}</span>
            )}
          </div>
          {!isNestedPagesDisabledForPage ? (
            <p className="truncate text-sm flex-grow min-w-0">
              {canCurrentUserAccessPage ? getPageName(page.name) : `Restricted Access`}
            </p>
          ) : (
            <p className="truncate text-sm flex-grow min-w-0">{"Please upgrade to view"}</p>
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

export const WikiPageSidebarListItem = memo(WikiPageSidebarListItemComponent);
