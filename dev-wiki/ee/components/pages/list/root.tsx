import { useMemo } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EUserPermissionsLevel, EPageAccess } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles, TPageNavigationTabs } from "@plane/types";
// components
import { DetailedEmptyState } from "@/components/empty-state";
import { PageListBlockRoot, PageLoader } from "@/components/pages";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web components
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// assets
import AllFiltersImage from "@/public/empty-state/pages/all-filters.svg";
import NameFilterImage from "@/public/empty-state/pages/name-filter.svg";

type Props = {
  pageType: TPageNavigationTabs;
};

export const WikiPagesListLayoutRoot: React.FC<Props> = observer((props) => {
  const { pageType } = props;
  const { workspaceSlug } = useParams();

  // plane hooks
  const { t } = useTranslation();
  // store hooks
  // const { toggleCreatePageModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const pageStore = usePageStore(EPageStoreType.WORKSPACE);
  const { filters, fetchPagesByType, filteredPublicPageIds, filteredArchivedPageIds, filteredPrivatePageIds } =
    pageStore;

  // Use SWR to fetch the data but not for rendering
  const { isLoading, data } = useSWR(
    workspaceSlug ? `WORKSPACE_PAGES_${workspaceSlug}_${pageType}_${filters.searchQuery || ""}` : null,
    workspaceSlug ? () => fetchPagesByType(pageType, filters.searchQuery) : null,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
    }
  );

  // Get the appropriate page IDs based on page type
  const pageIds = useMemo(() => {
    // If there's a search query, use the search results
    if (filters.searchQuery) {
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
  }, [pageType, filteredPublicPageIds, filteredPrivatePageIds, filteredArchivedPageIds, data, filters.searchQuery]);

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
              // toggleCreatePageModal({ isOpen: true, pageAccess: EPageAccess.PUBLIC });
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
              // toggleCreatePageModal({ isOpen: true, pageAccess: EPageAccess.PRIVATE });
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

    // General empty state when no pages are found
    return (
      <DetailedEmptyState
        title={t("workspace_pages.empty_state.general.title")}
        description={t("workspace_pages.empty_state.general.description")}
        assetPath={generalPageResolvedPath}
        primaryButton={{
          text: t("workspace_pages.empty_state.general.primary_button.text"),
          onClick: () => {
            // toggleCreatePageModal({ isOpen: true });
          },
          disabled: !hasWorkspaceMemberLevelPermissions,
        }}
      />
    );
  }

  // if no pages match the filter criteria
  if (filters.searchQuery && pageIds.length === 0)
    return (
      <div className="h-full w-full grid place-items-center">
        <div className="text-center">
          <Image
            src={filters.searchQuery.length > 0 ? NameFilterImage : AllFiltersImage}
            className="h-36 sm:h-48 w-36 sm:w-48 mx-auto"
            alt="No matching pages"
          />
          <h5 className="text-xl font-medium mt-7 mb-1">No matching pages</h5>
          <p className="text-custom-text-400 text-base">
            {filters.searchQuery.length > 0
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
