import { useMemo } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EUserPermissionsLevel, EPageAccess } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles, type TPageNavigationTabs } from "@plane/types";
// components
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { PageListBlockRoot } from "@/components/pages/list/block-root";
import { PageLoader } from "@/components/pages/loaders/page-loader";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";
import useDebounce from "@/hooks/use-debounce";
// plane web components
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

type Props = {
  pageType: TPageNavigationTabs;
};

export const WikiPagesListLayoutRoot: React.FC<Props> = observer((props) => {
  const { pageType } = props;
  const { workspaceSlug } = useParams();

  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleCreatePageModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const pageStore = usePageStore(EPageStoreType.WORKSPACE);
  const {
    filters,
    fetchPagesByType,
    filteredPublicPageIds,
    filteredArchivedPageIds,
    filteredPrivatePageIds,
    filteredSharedPageIds,
  } = pageStore;

  // Debounce the search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  // Use SWR to fetch the data but not for rendering
  const { isLoading, data } = useSWR(
    workspaceSlug ? `WORKSPACE_PAGES_${workspaceSlug}_${pageType}_${debouncedSearchQuery || ""}` : null,
    workspaceSlug ? () => fetchPagesByType(pageType, debouncedSearchQuery) : null,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
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
      case "shared":
        return filteredSharedPageIds;
      default:
        return [];
    }
  }, [
    pageType,
    filteredPublicPageIds,
    filteredPrivatePageIds,
    filteredArchivedPageIds,
    filteredSharedPageIds,
    data,
    debouncedSearchQuery,
  ]);

  // derived values - memoized for performance
  const hasWorkspaceMemberLevelPermissions = useMemo(
    () => allowPermissions([EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER], EUserPermissionsLevel.WORKSPACE),
    [allowPermissions]
  );

  const generalPageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/onboarding/pages",
  });
  const privatePageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/pages/private",
  });
  const publicPageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/pages/public",
  });
  const archivedPageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/pages/archived",
  });
  const sharedPageResolvedPath = useResolvedAssetPath({
    // todo - remove this and add a new asset for shared
    basePath: "/empty-state/pages/public",
  });
  const resolvedFiltersImage = useResolvedAssetPath({ basePath: "/empty-state/pages/all-filters", extension: "svg" });
  const resolvedNameFilterImage = useResolvedAssetPath({
    basePath: "/empty-state/pages/name-filter",
    extension: "svg",
  });

  if (isLoading) return <PageLoader />;

  // if no pages exist in the active page type
  if (!pageIds || pageIds.length === 0) {
    if (pageType === "public")
      return (
        <DetailedEmptyState
          title={t("workspace_pages.empty_state.public.title")}
          description={t("workspace_pages.empty_state.public.description")}
          assetPath={publicPageResolvedPath}
          primaryButton={{
            text: t("workspace_pages.empty_state.public.primary_button.text"),
            onClick: () => {
              toggleCreatePageModal({ isOpen: true, pageAccess: EPageAccess.PUBLIC });
            },
            disabled: !hasWorkspaceMemberLevelPermissions,
          }}
        />
      );
    if (pageType === "private")
      return (
        <DetailedEmptyState
          title={t("workspace_pages.empty_state.private.title")}
          description={t("workspace_pages.empty_state.private.description")}
          assetPath={privatePageResolvedPath}
          primaryButton={{
            text: t("workspace_pages.empty_state.private.primary_button.text"),
            onClick: () => {
              toggleCreatePageModal({ isOpen: true, pageAccess: EPageAccess.PRIVATE });
            },
            disabled: !hasWorkspaceMemberLevelPermissions,
          }}
        />
      );
    if (pageType === "archived")
      return (
        <DetailedEmptyState
          title={t("workspace_pages.empty_state.archived.title")}
          description={t("workspace_pages.empty_state.archived.description")}
          assetPath={archivedPageResolvedPath}
        />
      );
    if (pageType === "shared")
      return (
        <DetailedEmptyState
          title="No shared pages"
          description="Pages shared with you will appear here when someone shares them."
          assetPath={sharedPageResolvedPath}
        />
      );

    // General empty state when no pages are found
    return (
      <DetailedEmptyState
        title={t("workspace_pages.empty_state.general.title")}
        description={t("workspace_pages.empty_state.general.description")}
        assetPath={generalPageResolvedPath}
        primaryButton={{
          text: t("workspace_pages.empty_state.general.primary_button.text"),
          onClick: () => {
            toggleCreatePageModal({ isOpen: true });
          },
          disabled: !hasWorkspaceMemberLevelPermissions,
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
    <div className="size-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
      {pageIds.map((pageId) => (
        <PageListBlockRoot
          key={pageId}
          pageId={pageId}
          storeType={EPageStoreType.WORKSPACE}
          pageType={pageType}
          paddingLeft={0}
        />
      ))}
    </div>
  );
});
