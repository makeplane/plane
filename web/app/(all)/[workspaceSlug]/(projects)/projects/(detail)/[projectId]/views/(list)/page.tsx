"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles, EViewAccess, TViewFilterProps } from "@plane/types";
import { Header, EHeaderVariant } from "@plane/ui";
import { calculateTotalFilters } from "@plane/utils";
import { PageHead } from "@/components/core/page-title";
import { DetailedEmptyState } from "@/components/empty-state";
import { ProjectViewsList } from "@/components/views";
import { ViewAppliedFiltersList } from "@/components/views/applied-filters";
// constants
// helpers
// hooks
import { useProject, useProjectView, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

const ProjectViewsPage = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store
  const { getProjectById, currentProjectDetails } = useProject();
  const { filters, updateFilters, clearAllFilters } = useProjectView();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Views` : undefined;
  const canPerformEmptyStateActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/disabled-feature/views" });

  const handleRemoveFilter = useCallback(
    (key: keyof TViewFilterProps, value: string | EViewAccess | null) => {
      let newValues = filters.filters?.[key];

      if (key === "favorites") {
        newValues = !!value;
      }
      if (Array.isArray(newValues)) {
        if (!value) newValues = [];
        else newValues = newValues.filter((val) => val !== value) as string[];
      }

      updateFilters("filters", { [key]: newValues });
    },
    [filters.filters, updateFilters]
  );

  const isFiltersApplied = calculateTotalFilters(filters?.filters ?? {}) !== 0;

  if (!workspaceSlug || !projectId) return <></>;

  // No access to
  if (currentProjectDetails?.issue_views_view === false)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <DetailedEmptyState
          title={t("disabled_project.empty_state.view.title")}
          description={t("disabled_project.empty_state.view.description")}
          assetPath={resolvedPath}
          primaryButton={{
            text: t("disabled_project.empty_state.view.primary_button.text"),
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
      {isFiltersApplied && (
        <Header variant={EHeaderVariant.TERNARY}>
          <ViewAppliedFiltersList
            appliedFilters={filters.filters ?? {}}
            handleClearAllFilters={clearAllFilters}
            handleRemoveFilter={handleRemoveFilter}
            alwaysAllowEditing
          />
        </Header>
      )}
      <ProjectViewsList />
    </>
  );
});

export default ProjectViewsPage;
