import { useEffect, useMemo, useRef, useState } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useSWR from "swr";
// plane imports
import {
  EPageAccess,
  EUserPermissionsLevel,
  PROJECT_PAGE_TRACKER_ELEMENTS,
  PROJECT_PAGE_TRACKER_EVENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles, type TPageNavigationTabs, TPage, TPageDragPayload } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { PageListBlockRoot } from "@/components/pages/list/block-root";
import { PageLoader } from "@/components/pages/loaders/page-loader";
// helpers
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import useDebounce from "@/hooks/use-debounce";
// plane web components
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

const storeType = EPageStoreType.PROJECT;

type Props = {
  pageType: TPageNavigationTabs;
  workspaceSlug: string;
  projectId: string;
};

export const ProjectPagesListRoot: React.FC<Props> = observer((props) => {
  const { pageType, workspaceSlug, projectId } = props;
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
  const { currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();
  const {
    filters,
    fetchPagesByType,
    filteredPublicPageIds,
    filteredArchivedPageIds,
    filteredPrivatePageIds,
    createPage,
    movePageInternally,
    getPageById,
    isNestedPagesEnabled,
  } = usePageStore(storeType);

  // Debounce the search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  // Use SWR to fetch the data but not for rendering
  const { isLoading, data } = useSWR(
    workspaceSlug && projectId ? `PROJECT_PAGES_${projectId}_${pageType}_${debouncedSearchQuery || ""}` : null,
    workspaceSlug && projectId
      ? () => fetchPagesByType(workspaceSlug, projectId, pageType, debouncedSearchQuery)
      : null,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 2000, // Disable deduping to ensure fresh requests
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
      case "private":
        return filteredPrivatePageIds;
      case "archived":
        return filteredArchivedPageIds;
      default:
        return [];
    }
  }, [pageType, filteredPublicPageIds, filteredPrivatePageIds, filteredArchivedPageIds, data, debouncedSearchQuery]);

  // derived values - memoized for performance
  const hasProjectMemberLevelPermissions = useMemo(
    () => allowPermissions([EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER], EUserPermissionsLevel.PROJECT),
    [allowPermissions]
  );

  // handle page create
  const handleCreatePage = async (pageAccess?: EPageAccess) => {
    setIsCreatingPage(true);

    const payload: Partial<TPage> = {
      access: pageAccess || (pageType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC),
    };

    await createPage(payload)
      .then((res) => {
        captureSuccess({
          eventName: PROJECT_PAGE_TRACKER_EVENTS.create,
          payload: {
            id: res?.id,
            state: "SUCCESS",
          },
        });
        const pageId = `/${workspaceSlug}/projects/${currentProjectDetails?.id}/pages/${res?.id}`;
        router.push(pageId);
      })
      .catch((err) => {
        captureError({
          eventName: PROJECT_PAGE_TRACKER_EVENTS.create,
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

  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

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

        // Update access based on current section
        let targetAccess: EPageAccess | undefined;
        if (pageType === "public") {
          targetAccess = EPageAccess.PUBLIC;
        } else if (pageType === "private") {
          targetAccess = EPageAccess.PRIVATE;
        }

        if (targetAccess && droppedPageDetails.access !== targetAccess) {
          updatePayload.access = targetAccess;
        }

        movePageInternally(droppedPageId, updatePayload);
      },
      canDrop: ({ source }) => {
        // Don't allow drops if user doesn't have permissions or in archived section
        if (!hasProjectMemberLevelPermissions || pageType === "archived") {
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
          // For shared pages, only the owner can move them
          (!sourcePage.is_shared || sourcePage.isCurrentUserOwner)
        );
      },
    });
  }, [
    hasProjectMemberLevelPermissions,
    pageType,
    getPageById,
    isNestedPagesEnabled,
    workspaceSlug,
    movePageInternally,
  ]);

  const generalPageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/onboarding/pages",
  });
  const publicPageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/pages/public",
  });
  const privatePageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/pages/private",
  });
  const archivedPageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/pages/archived",
  });
  const resolvedFiltersImage = useResolvedAssetPath({ basePath: "/empty-state/pages/all-filters", extension: "svg" });
  const resolvedNameFilterImage = useResolvedAssetPath({
    basePath: "/empty-state/pages/name-filter",
    extension: "svg",
  });

  if (isLoading) return <PageLoader />;

  // if no pages exist in the active page type
  if (pageIds.length === 0) {
    if (pageType === "public")
      return (
        <DetailedEmptyState
          title={t("project_page.empty_state.public.title")}
          description={t("project_page.empty_state.public.description")}
          assetPath={publicPageResolvedPath}
          primaryButton={{
            text: isCreatingPage ? t("creating") : t("project_page.empty_state.public.primary_button.text"),
            onClick: () => {
              handleCreatePage();
              captureClick({ elementName: PROJECT_PAGE_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_BUTTON });
            },
            disabled: !canPerformEmptyStateActions || isCreatingPage,
          }}
        />
      );
    if (pageType === "private")
      return (
        <DetailedEmptyState
          title={t("project_page.empty_state.private.title")}
          description={t("project_page.empty_state.private.description")}
          assetPath={privatePageResolvedPath}
          primaryButton={{
            text: isCreatingPage ? t("creating") : t("project_page.empty_state.private.primary_button.text"),
            onClick: () => {
              handleCreatePage();
              captureClick({ elementName: PROJECT_PAGE_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_BUTTON });
            },
            disabled: !canPerformEmptyStateActions || isCreatingPage,
          }}
        />
      );
    if (pageType === "archived")
      return (
        <DetailedEmptyState
          title={t("project_page.empty_state.archived.title")}
          description={t("project_page.empty_state.archived.description")}
          assetPath={archivedPageResolvedPath}
        />
      );
    // General empty state when no pages are found
    return (
      <DetailedEmptyState
        title={t("project_page.empty_state.general.title")}
        description={t("project_page.empty_state.general.description")}
        assetPath={generalPageResolvedPath}
        primaryButton={{
          text: isCreatingPage ? t("creating") : t("project_page.empty_state.general.primary_button.text"),
          onClick: () => {
            handleCreatePage();
            captureClick({ elementName: PROJECT_PAGE_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_BUTTON });
          },
          disabled: !hasProjectMemberLevelPermissions || isCreatingPage,
        }}
      />
    );
  }

  // if no pages match the filter criteria
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
