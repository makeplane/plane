import { useCallback } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TModuleFilters } from "@plane/types";
import { EUserProjectRoles } from "@plane/types";
import { calculateTotalFilters } from "@plane/utils";
// assets
import darkModulesAsset from "@/app/assets/empty-state/disabled-feature/modules-dark.webp?url";
import lightModulesAsset from "@/app/assets/empty-state/disabled-feature/modules-light.webp?url";
// components
import { PageHead } from "@/components/core/page-title";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { ModuleAppliedFiltersList, ModulesListView } from "@/components/modules";
// hooks
import { useModuleFilter } from "@/hooks/store/use-module-filter";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import type { Route } from "./+types/page";

function ProjectModulesPage({ params }: Route.ComponentProps) {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = params;
  // theme hook
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // store
  const { getProjectById, currentProjectDetails } = useProject();
  const {
    currentProjectFilters = {},
    currentProjectDisplayFilters,
    clearAllFilters,
    updateFilters,
    updateDisplayFilters,
  } = useModuleFilter();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project?.name} - Modules` : undefined;
  const canPerformEmptyStateActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const resolvedPath = resolvedTheme === "light" ? lightModulesAsset : darkModulesAsset;

  const handleRemoveFilter = useCallback(
    (key: keyof TModuleFilters, value: string | null) => {
      let newValues = currentProjectFilters[key] ?? [];

      if (!value) newValues = [];
      else newValues = newValues.filter((val) => val !== value);

      updateFilters(projectId, { [key]: newValues });
    },
    [currentProjectFilters, projectId, updateFilters]
  );

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
        {(calculateTotalFilters(currentProjectFilters) !== 0 || currentProjectDisplayFilters?.favorites) && (
          <ModuleAppliedFiltersList
            appliedFilters={currentProjectFilters}
            isFavoriteFilterApplied={currentProjectDisplayFilters?.favorites ?? false}
            handleClearAllFilters={() => clearAllFilters(projectId)}
            handleRemoveFilter={handleRemoveFilter}
            handleDisplayFiltersUpdate={(val) => updateDisplayFilters(projectId, val)}
            alwaysAllowEditing
          />
        )}
        <ModulesListView />
      </div>
    </>
  );
}

export default observer(ProjectModulesPage);
