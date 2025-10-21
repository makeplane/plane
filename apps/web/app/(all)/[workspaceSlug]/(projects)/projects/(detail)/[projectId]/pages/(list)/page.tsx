"use client";

import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TPageNavigationTabs } from "@plane/types";
import { EUserProjectRoles } from "@plane/types";
// components
import { PageHead } from "@/components/core/page-title";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { PagesListRoot } from "@/components/pages/list/root";
import { PagesListView } from "@/components/pages/pages-list-view";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web hooks
import { EPageStoreType } from "@/plane-web/hooks/store";

type ProjectPagesPageProps = {
  params: {
    workspaceSlug: string;
    projectId: string;
  };
};

function getPageType(type: string | null): TPageNavigationTabs {
  switch (type) {
    case "private":
      return "private";
    case "archived":
      return "archived";
    default:
      return "public";
  }
};

function ProjectPagesPage({ params }: ProjectPagesPageProps) {
  const { workspaceSlug, projectId } = params;
  // router
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getProjectById, currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project?.name} - Pages` : undefined;
  const pageType = getPageType(type);
  const canPerformEmptyStateActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/disabled-feature/pages" });



  // No access to cycle
  if (currentProjectDetails?.page_view === false)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <DetailedEmptyState
          title={t("disabled_project.empty_state.page.title")}
          description={t("disabled_project.empty_state.page.description")}
          assetPath={resolvedPath}
          primaryButton={{
            text: t("disabled_project.empty_state.page.primary_button.text"),
            onClick: () => {
              router.push(`/${workspaceSlug}/settings/projects/${projectId}/features`);
            },
            disabled: !canPerformEmptyStateActions,
          }}
        />
      </div>
    );
  return (
    <>
      <PageHead title={pageTitle} />
      <PagesListView
        pageType={pageType}
        projectId={projectId}
        storeType={EPageStoreType.PROJECT}
        workspaceSlug={workspaceSlug}
      >
        <PagesListRoot pageType={pageType} storeType={EPageStoreType.PROJECT} />
      </PagesListView>
    </>
  );
}

export default observer(ProjectPagesPage);
