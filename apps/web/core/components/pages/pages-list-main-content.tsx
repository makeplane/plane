"use client";
import { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
// plane imports
import { useParams, useRouter } from "next/navigation";
import {
  EUserPermissionsLevel,
  EPageAccess,
  PROJECT_PAGE_TRACKER_ELEMENTS,
  PROJECT_PAGE_TRACKER_EVENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TPage, TPageNavigationTabs } from "@plane/types";
import { EUserProjectRoles } from "@plane/types";
// components
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { PageLoader } from "@/components/pages/loaders/page-loader";
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

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
  const { currentProjectDetails } = useProject();
  const { isAnyPageAvailable, getCurrentProjectFilteredPageIdsByTab, getCurrentProjectPageIdsByTab, filters, loader } =
    usePageStore(storeType);
  const { allowPermissions } = useUserPermissions();
  const { createPage } = usePageStore(EPageStoreType.PROJECT);
  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = useParams();
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
    basePath: "/empty-state/wiki/public",
  });
  const privatePageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/wiki/private",
  });
  const archivedPageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/wiki/archived",
  });
  const resolvedFiltersImage = useResolvedAssetPath({ basePath: "/empty-state/wiki/all-filters", extension: "svg" });
  const resolvedNameFilterImage = useResolvedAssetPath({
    basePath: "/empty-state/wiki/name-filter",
    extension: "svg",
  });

  // handle page create
  const handleCreatePage = async () => {
    setIsCreatingPage(true);

    const payload: Partial<TPage> = {
      access: pageType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC,
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
            text: isCreatingPage ? t("creating") : t("project_page.empty_state.general.primary_button.text"),
            onClick: () => {
              handleCreatePage();
              captureClick({ elementName: PROJECT_PAGE_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_BUTTON });
            },
            disabled: !canPerformEmptyStateActions || isCreatingPage,
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
  }
  // if no pages match the filter criteria
  if (filteredPageIds?.length === 0)
    return (
      <div className="h-full w-full grid place-items-center">
        <div className="text-center">
          <Image
            src={filters.searchQuery.length > 0 ? resolvedNameFilterImage : resolvedFiltersImage}
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
