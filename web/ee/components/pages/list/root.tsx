import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, EUserWorkspaceRoles, EPageAccess } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TPageNavigationTabs } from "@plane/types";
// components
import { DetailedEmptyState } from "@/components/empty-state";
import { PageLoader } from "@/components/pages";
// hooks
import { useCommandPalette, useUserPermissions } from "@/hooks/store";
// plane web components
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { PageListBlock } from "@/plane-web/components/pages";
// plane web hooks
import { useWorkspacePages } from "@/plane-web/hooks/store";
// assets
import AllFiltersImage from "@/public/empty-state/pages/all-filters.svg";
import NameFilterImage from "@/public/empty-state/pages/name-filter.svg";

type Props = {
  pageType: TPageNavigationTabs;
};

export const PagesListLayoutRoot: React.FC<Props> = observer((props) => {
  const { pageType } = props;
  // params
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleCreatePageModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const {
    filters,
    getCurrentWorkspacePageIdsByType,
    getCurrentWorkspaceFilteredPageIdsByType,
    loader,
    isAnyPageAvailable,
  } = useWorkspacePages();
  // derived values
  const pageIds = getCurrentWorkspacePageIdsByType(pageType);
  const filteredPageIds = getCurrentWorkspaceFilteredPageIdsByType(pageType);
  const hasWorkspaceMemberLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
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

  if (loader === "init-loader") return <PageLoader />;
  // if no pages exist in the active page type
  if (!isAnyPageAvailable || pageIds?.length === 0) {
    if (!isAnyPageAvailable) {
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
  }

  // if no pages match the filter criteria
  if (filteredPageIds?.length === 0)
    return (
      <div className="h-full w-full grid place-items-center">
        <div className="text-center">
          <Image
            src={filters.searchQuery.length > 0 ? NameFilterImage : AllFiltersImage}
            className="h-36 sm:h-48 w-36 sm:w-48 mx-auto"
            alt="No matching modules"
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
      {filteredPageIds?.map((pageId) => (
        <PageListBlock key={pageId} workspaceSlug={workspaceSlug.toString()} pageId={pageId} />
      ))}
    </div>
  );
});
