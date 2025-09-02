"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { ArchiveIcon, ChevronRight, FileText, Loader } from "lucide-react";
// plane imports
import { EmptyPageIcon, RestrictedPageIcon, setToast, TOAST_TYPE } from "@plane/ui";
import { cn, getPageName } from "@plane/utils";
// components
import { Logo } from "@/components/common/logo";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
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
  const { handleToggleExpanded, isExpanded, paddingLeft, pageId, isHovered, canShowAddButton } = props;
  // states
  const [isFetchingSubPages, setIsFetchingSubPages] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  // navigation
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // router
  const router = useAppRouter();
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
    name,
  } = page ?? {};

  const isNestedPagesDisabledForPage = useMemo(
    () => !isNestedPagesEnabled(workspaceSlug?.toString()) && page?.parent_id,
    [isNestedPagesEnabled, workspaceSlug, page?.parent_id]
  );

  const isDescriptionEmpty = useMemo(
    () => is_description_empty || description_html === "<p></p>",
    [is_description_empty, description_html]
  );

  const isPageActive = useMemo(
    () => pathname === `/${workspaceSlug}/wiki/${page?.id}/`,
    [pathname, workspaceSlug, page?.id]
  );

  const pageLink = useMemo(() => getRedirectionLink?.() ?? "", [getRedirectionLink]);

  const shouldShowSubPagesButton = useMemo(
    () => sub_pages_count !== undefined && sub_pages_count > 0,
    [sub_pages_count]
  );

  const showAddButton = isHovered && canShowAddButton;

  // Centralized page content and state based on conditions
  const pageContent = useMemo(() => {
    const baseName = getPageName(name);
    const isRestricted = !canCurrentUserAccessPage;
    const needsUpgrade = isNestedPagesDisabledForPage;
    const isArchived = !!archived_at;

    const displayName = (() => {
      if (needsUpgrade) return "Please upgrade to view";
      if (isRestricted) return "Restricted Access";
      return baseName;
    })();

    return {
      tooltipText: baseName,
      logo: (() => {
        if (isRestricted || needsUpgrade) {
          return <RestrictedPageIcon className="size-3.5" />;
        }
        if (logo_props?.in_use) {
          return <Logo logo={logo_props} size={14} type="lucide" />;
        }
        if (!isDescriptionEmpty) {
          return <FileText className="size-3.5" />;
        }
        return <EmptyPageIcon className="size-3.5" />;
      })(),
      status: {
        isRestricted,
        needsUpgrade,
        isArchived,
        hasAccess: !isRestricted && !needsUpgrade,
      },
      displayName,
    };
  }, [canCurrentUserAccessPage, isNestedPagesDisabledForPage, archived_at, logo_props, isDescriptionEmpty, name]);

  // Memoize event handlers to prevent recreation
  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  const handleSubPagesToggle = useCallback(
    async (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleToggleExpanded();

      // Only fetch if expanding
      if (!isExpanded) {
        setIsFetchingSubPages(true);
        try {
          await fetchSubPages?.();
        } catch {
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

  const handleNavigate = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!pageContent?.status.hasAccess) {
        return;
      }

      if ("metaKey" in e && (e.metaKey || e.ctrlKey)) {
        window.open(pageLink, "_blank", "noopener,noreferrer");
        return;
      }

      // Regular click navigation
      if (!isPageActive) {
        router.push(pageLink);
      } else {
        handleSubPagesToggle(e);
      }
    },
    [isPageActive, pageContent?.status.hasAccess, router, pageLink, handleSubPagesToggle]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Handle Enter and Space keys for accessibility
      if (e.key === "Enter" || e.key === " ") {
        handleNavigate(e);
      }
    },
    [handleNavigate]
  );

  // Memoize class names
  const linkClassName = useMemo(
    () =>
      cn(
        "group w-full flex items-center justify-between gap-1 py-1.5 rounded-md text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90",
        {
          "bg-custom-primary-100/10 hover:bg-custom-primary-100/10 text-custom-primary-100 font-medium": isPageActive,
          "cursor-pointer": pageContent?.status.hasAccess && !isPageActive,
          "cursor-default": !pageContent?.status.hasAccess || isPageActive,
        }
      ),
    [isPageActive, pageContent?.status.hasAccess]
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
    <div
      role="button"
      tabIndex={0}
      className={linkClassName}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={pageContent?.displayName}
      aria-expanded={shouldShowSubPagesButton ? isExpanded : undefined}
      aria-disabled={pageContent?.status.hasAccess ?? true}
      aria-current={isPageActive ? "page" : undefined}
    >
      <div className={contentContainerClassName} style={contentStyle}>
        <div className="size-4 flex-shrink-0 grid place-items-center">
          {shouldShowSubPagesButton && isHovering ? (
            <button
              type="button"
              onClick={handleSubPagesToggle}
              className="rounded hover:bg-custom-background-80 grid place-items-center"
              data-prevent-progress
            >
              {isFetchingSubPages ? (
                <Loader className="size-3.5 animate-spin" />
              ) : (
                <ChevronRight className={chevronClassName} strokeWidth={2.5} />
              )}
            </button>
          ) : (
            <span className="grid place-items-center">{pageContent?.logo}</span>
          )}
        </div>
        <p className="truncate text-sm flex-grow min-w-0">{pageContent?.displayName}</p>
      </div>
      {archived_at && (
        <div className="flex-shrink-0 size-4 grid place-items-center">
          <ArchiveIcon className="size-3.5 text-custom-text-300" />
        </div>
      )}
    </div>
  );
});

export const WikiPageSidebarListItem = memo(WikiPageSidebarListItemComponent);
