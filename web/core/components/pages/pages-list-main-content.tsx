import { observer } from "mobx-react";
import Image from "next/image";
// plane imports
import { EUserPermissionsLevel, EPageAccess, PROJECT_PAGE_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles, TPageNavigationTabs } from "@plane/types";
// components
import { DetailedEmptyState } from "@/components/empty-state";
import { PageLoader } from "@/components/pages";
import { captureClick } from "@/helpers/event-tracker.helper";
import { useCommandPalette, useUserPermissions } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// assets
import AllFiltersImage from "@/public/empty-state/pages/all-filters.svg";
import NameFilterImage from "@/public/empty-state/pages/name-filter.svg";

type Props = {
  children: React.ReactNode;
  pageType: TPageNavigationTabs;
  storeType: EPageStoreType;
};

export const PagesListMainContent: React.FC<Props> = observer((props) => {
  const { children, pageType, storeType } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { loader, isAnyPageAvailable, getCurrentProjectFilteredPageIdsByTab, getCurrentProjectPageIdsByTab, filters } =
    usePageStore(storeType);
  const { toggleCreatePageModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const pageIds = getCurrentProjectPageIdsByTab(pageType);
  const filteredPageIds = getCurrentProjectFilteredPageIdsByTab(pageType);
  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
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

  if (loader === "init-loader") return <PageLoader />;
  // if no pages exist in the active page type
  if (!isAnyPageAvailable || pageIds?.length === 0) {
    if (!isAnyPageAvailable) {
      return (
        <DetailedEmptyState
          title={t("project_page.empty_state.general.title")}
          description={t("project_page.empty_state.general.description")}
          assetPath={generalPageResolvedPath}
          primaryButton={{
            text: t("project_page.empty_state.general.primary_button.text"),
            onClick: () => {
              toggleCreatePageModal({ isOpen: true });
              captureClick({ elementName: PROJECT_PAGE_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_BUTTON });
            },
            disabled: !canPerformEmptyStateActions,
          }}
        />
      );
    }
    if (pageType === "public")
      return (
        <DetailedEmptyState
          title={t("project_page.empty_state.public.title")}
          description={t("project_page.empty_state.public.description")}
          assetPath={publicPageResolvedPath}
          primaryButton={{
            text: t("project_page.empty_state.public.primary_button.text"),
            onClick: () => {
              toggleCreatePageModal({ isOpen: true, pageAccess: EPageAccess.PUBLIC });
              captureClick({ elementName: PROJECT_PAGE_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_BUTTON });
            },
            disabled: !canPerformEmptyStateActions,
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
            text: t("project_page.empty_state.private.primary_button.text"),
            onClick: () => {
              toggleCreatePageModal({ isOpen: true, pageAccess: EPageAccess.PRIVATE });
              captureClick({ elementName: PROJECT_PAGE_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_BUTTON });
            },
            disabled: !canPerformEmptyStateActions,
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

  return <div className="h-full w-full overflow-hidden">{children}</div>;
});
