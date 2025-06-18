"use client";

import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles, TPageNavigationTabs } from "@plane/types";
// components
import { PageHead } from "@/components/core";
import { DetailedEmptyState } from "@/components/empty-state";
import { PagesListRoot, PagesListView } from "@/components/pages";
// hooks
import { useProject, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web hooks
import { EPageStoreType } from "@/plane-web/hooks/store";

const ProjectPagesPage = observer(() => {
  // router
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const { workspaceSlug, projectId } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getProjectById, currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Pages` : undefined;
  const canPerformEmptyStateActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/disabled-feature/pages" });

  const currentPageType = (): TPageNavigationTabs => {
    const pageType = type?.toString();
    if (pageType === "private") return "private";
    if (pageType === "archived") return "archived";
    return "public";
  };

  if (!workspaceSlug || !projectId) return <></>;

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
        pageType={currentPageType()}
        projectId={projectId.toString()}
        storeType={EPageStoreType.PROJECT}
        workspaceSlug={workspaceSlug.toString()}
      >
        <PagesListRoot pageType={currentPageType()} storeType={EPageStoreType.PROJECT} />
      </PagesListView>
    </>
  );
});

export default ProjectPagesPage;
