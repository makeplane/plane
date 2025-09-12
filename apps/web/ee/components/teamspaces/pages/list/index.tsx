import { useEffect, useMemo, useRef, useState } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EPageAccess, TEAMSPACE_PAGE_TRACKER_ELEMENTS, TEAMSPACE_PAGE_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TPageNavigationTabs, TPage, TPageDragPayload } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { PageListBlockRoot } from "@/components/pages/list/block-root";
import { PageLoader } from "@/components/pages/loaders/page-loader";
// helpers
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import useDebounce from "@/hooks/use-debounce";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web hooks
import { EPageStoreType, usePageStore, useTeamspaces } from "@/plane-web/hooks/store";

const storeType = EPageStoreType.TEAMSPACE;

type Props = {
  pageType: TPageNavigationTabs;
  workspaceSlug: string;
  teamspaceId: string;
};

export const TeamspacePagesListRoot: React.FC<Props> = observer((props) => {
  const { pageType, workspaceSlug, teamspaceId } = props;

  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [isRootDropping, setIsRootDropping] = useState(false);

  // refs
  const rootDropRef = useRef<HTMLDivElement>(null);

  // router
  const router = useRouter();

  // plane hooks
  const { t } = useTranslation();

  // store hooks
  const { getTeamspaceById } = useTeamspaces();
  const {
    filters,
    fetchPagesByType,
    filteredPublicPageIds,
    filteredArchivedPageIds,
    createPage,
    movePageInternally,
    getPageById,
    isNestedPagesEnabled,
  } = usePageStore(storeType);

  // derived values
  const currentTeamspace = getTeamspaceById(teamspaceId);

  // Debounce the search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  // Use SWR to fetch the data
  const { isLoading, data } = useSWR(
    workspaceSlug && teamspaceId && pageType
      ? `TEAMSPACE_PAGES_${teamspaceId}_${pageType}_${debouncedSearchQuery || ""}`
      : null,
    workspaceSlug && teamspaceId && pageType
      ? () => fetchPagesByType(workspaceSlug, teamspaceId, pageType, debouncedSearchQuery)
      : null,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 2000,
    }
  );

  // Get the appropriate page IDs based on page type
  const pageIds = useMemo(() => {
    // If there's a search query, use the search results
    if (debouncedSearchQuery) {
      return (data?.map((page) => page.id).filter(Boolean) as string[]) || [];
    }
    switch (pageType) {
      case "public":
        return filteredPublicPageIds;
      case "archived":
        return filteredArchivedPageIds;
      default:
        return [];
    }
  }, [pageType, filteredPublicPageIds, filteredArchivedPageIds, data, debouncedSearchQuery]);

  // handle page create
  const handleCreatePage = async (pageAccess?: EPageAccess) => {
    setIsCreatingPage(true);

    const payload: Partial<TPage> = {
      access: pageAccess || EPageAccess.PUBLIC, // Always public for teamspaces
    };

    await createPage(payload)
      .then((res) => {
        captureSuccess({
          eventName: TEAMSPACE_PAGE_TRACKER_EVENTS.PAGE_CREATE,
          payload: {
            id: res?.id,
            state: "SUCCESS",
          },
        });
        const pageId = `/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${res?.id}`;
        router.push(pageId);
      })
      .catch((err) => {
        captureError({
          eventName: TEAMSPACE_PAGE_TRACKER_EVENTS.PAGE_CREATE,
          payload: {
            state: "ERROR",
          },
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.data?.error || "Page could not be created. Please try again.",
        });
      })
      .finally(() => setIsCreatingPage(false));
  };

  // Root level drop target
  useEffect(() => {
    const element = rootDropRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      onDragEnter: () => setIsRootDropping(true),
      onDragLeave: () => setIsRootDropping(false),
      onDrop: ({ location, source }) => {
        setIsRootDropping(false);

        // Only handle drops that are ONLY on the root container (not on individual pages)
        if (location.current.dropTargets.length !== 1) return;

        const { id: droppedPageId } = source.data as TPageDragPayload;
        const droppedPageDetails = getPageById(droppedPageId);
        if (!droppedPageDetails) return;

        // Move to root level (no parent)
        const updatePayload: { parent_id: string | null; access?: EPageAccess } = {
          parent_id: null,
        };

        movePageInternally(droppedPageId, updatePayload);
      },
      canDrop: ({ source }) => {
        // Don't allow drops if user doesn't have permissions or in archived section
        if (pageType === "archived") {
          return false;
        }

        const { id: droppedPageId } = source.data as TPageDragPayload;
        const sourcePage = getPageById(droppedPageId);
        if (!sourcePage) return false;

        return (
          sourcePage.canCurrentUserEditPage &&
          sourcePage.isContentEditable &&
          isNestedPagesEnabled(workspaceSlug) &&
          !sourcePage.archived_at &&
          sourcePage.isCurrentUserOwner
        );
      },
    });
  }, [pageType, getPageById, isNestedPagesEnabled, workspaceSlug, movePageInternally]);

  // Empty state images
  const publicPageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/pages/public",
  });
  const archivedPageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/pages/archived",
  });
  const resolvedFiltersImage = useResolvedAssetPath({
    basePath: "/empty-state/pages/all-filters",
    extension: "svg",
  });
  const resolvedNameFilterImage = useResolvedAssetPath({
    basePath: "/empty-state/pages/name-filter",
    extension: "svg",
  });

  if (isLoading) return <PageLoader />;

  // Empty states
  if (pageIds.length === 0) {
    if (pageType === "public")
      return (
        <DetailedEmptyState
          title="No public pages yet"
          description="Create your first public page to get started"
          assetPath={publicPageResolvedPath}
          primaryButton={{
            text: isCreatingPage ? "Creating" : "Create public page",
            onClick: () => {
              handleCreatePage();
              captureClick({ elementName: TEAMSPACE_PAGE_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_PAGE_BUTTON });
            },
            disabled: isCreatingPage,
          }}
        />
      );

    if (pageType === "archived")
      return (
        <DetailedEmptyState
          title="No archived pages"
          description="Pages you archive will appear here"
          assetPath={archivedPageResolvedPath}
        />
      );
  }

  // No matching filter results
  if (debouncedSearchQuery && pageIds.length === 0)
    return (
      <div className="h-full w-full grid place-items-center">
        <div className="text-center">
          <Image
            src={debouncedSearchQuery.length > 0 ? resolvedNameFilterImage : resolvedFiltersImage}
            className="h-36 sm:h-48 w-36 sm:w-48 mx-auto"
            alt="No matching pages"
          />
          <h5 className="text-xl font-medium mt-7 mb-1">No matching pages</h5>
          <p className="text-custom-text-400 text-base">
            {debouncedSearchQuery.length > 0
              ? "Remove the search criteria to see all pages"
              : "Remove the filters to see all pages"}
          </p>
        </div>
      </div>
    );

  return (
    <div
      ref={rootDropRef}
      className={`size-full overflow-y-scroll vertical-scrollbar scrollbar-sm ${
        isRootDropping ? "bg-custom-background-80" : ""
      }`}
    >
      {pageIds.map((pageId) => (
        <PageListBlockRoot
          key={pageId}
          pageId={pageId}
          storeType={storeType}
          pageType={pageType}
          paddingLeft={0}
          sectionType={pageType}
        />
      ))}
    </div>
  );
});
