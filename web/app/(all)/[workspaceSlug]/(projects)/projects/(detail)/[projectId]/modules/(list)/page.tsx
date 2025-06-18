"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles, TModuleFilters } from "@plane/types";
// components
import { calculateTotalFilters } from "@plane/utils";
import { PageHead } from "@/components/core/page-title";
import { DetailedEmptyState } from "@/components/empty-state";
import { ModuleAppliedFiltersList, ModulesListView } from "@/components/modules";
// helpers
// hooks
import { useModuleFilter, useProject, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

const ProjectModulesPage = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store
  const { getProjectById, currentProjectDetails } = useProject();
  const { currentProjectFilters, currentProjectDisplayFilters, clearAllFilters, updateFilters, updateDisplayFilters } =
    useModuleFilter();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Modules` : undefined;
  const canPerformEmptyStateActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/disabled-feature/modules" });

  const handleRemoveFilter = useCallback(
    (key: keyof TModuleFilters, value: string | null) => {
      if (!projectId) return;
      let newValues = currentProjectFilters?.[key] ?? [];

      if (!value) newValues = [];
      else newValues = newValues.filter((val) => val !== value);

      updateFilters(projectId.toString(), { [key]: newValues });
    },
    [currentProjectFilters, projectId, updateFilters]
  );

  if (!workspaceSlug || !projectId) return <></>;

  // No access to
  if (currentProjectDetails?.module_view === false)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <DetailedEmptyState
          title={t("disabled_project.empty_state.module.title")}
          description={t("disabled_project.empty_state.module.description")}
          assetPath={resolvedPath}
          primaryButton={{
            text: t("disabled_project.empty_state.module.primary_button.text"),
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
      <div className="h-full w-full flex flex-col">
        {(calculateTotalFilters(currentProjectFilters ?? {}) !== 0 || currentProjectDisplayFilters?.favorites) && (
          <ModuleAppliedFiltersList
            appliedFilters={currentProjectFilters ?? {}}
            isFavoriteFilterApplied={currentProjectDisplayFilters?.favorites ?? false}
            handleClearAllFilters={() => clearAllFilters(`${projectId}`)}
            handleRemoveFilter={handleRemoveFilter}
            handleDisplayFiltersUpdate={(val) => {
              if (!projectId) return;
              updateDisplayFilters(projectId.toString(), val);
            }}
            alwaysAllowEditing
          />
        )}
        <ModulesListView />
      </div>
    </>
  );
});

export default ProjectModulesPage;
