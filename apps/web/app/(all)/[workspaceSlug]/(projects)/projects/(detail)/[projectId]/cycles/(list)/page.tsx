"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, CYCLE_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles, TCycleFilters } from "@plane/types";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import { calculateTotalFilters } from "@plane/utils";
import { PageHead } from "@/components/core/page-title";
import { CyclesView, CycleCreateUpdateModal, CycleAppliedFiltersList } from "@/components/cycles";
import { ComicBoxButton, DetailedEmptyState } from "@/components/empty-state";
import { CycleModuleListLayout } from "@/components/ui";
// helpers
// hooks
import { useCycle, useProject, useCycleFilter, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

const ProjectCyclesPage = observer(() => {
  // states
  const [createModal, setCreateModal] = useState(false);
  // store hooks
  const { currentProjectCycleIds, loader } = useCycle();
  const { getProjectById, currentProjectDetails } = useProject();
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // cycle filters hook
  const { clearAllFilters, currentProjectFilters, updateFilters } = useCycleFilter();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const totalCycles = currentProjectCycleIds?.length ?? 0;
  const project = projectId ? getProjectById(projectId?.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - ${t("common.cycles", { count: 2 })}` : undefined;
  const hasAdminLevelPermission = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const hasMemberLevelPermission = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/disabled-feature/cycles" });

  const handleRemoveFilter = (key: keyof TCycleFilters, value: string | null) => {
    if (!projectId) return;
    let newValues = currentProjectFilters?.[key] ?? [];

    if (!value) newValues = [];
    else newValues = newValues.filter((val) => val !== value);

    updateFilters(projectId.toString(), { [key]: newValues });
  };

  if (!workspaceSlug || !projectId) return <></>;

  // No access to cycle
  if (currentProjectDetails?.cycle_view === false)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <DetailedEmptyState
          title={t("disabled_project.empty_state.cycle.title")}
          description={t("disabled_project.empty_state.cycle.description")}
          assetPath={resolvedPath}
          primaryButton={{
            text: t("disabled_project.empty_state.cycle.primary_button.text"),
            onClick: () => {
              router.push(`/${workspaceSlug}/settings/projects/${projectId}/features`);
            },
            disabled: !hasAdminLevelPermission,
          }}
        />
      </div>
    );

  if (loader) return <CycleModuleListLayout />;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="w-full h-full">
        <CycleCreateUpdateModal
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          isOpen={createModal}
          handleClose={() => setCreateModal(false)}
        />
        {totalCycles === 0 ? (
          <div className="h-full place-items-center">
            <DetailedEmptyState
              title={t("project_cycles.empty_state.general.title")}
              description={t("project_cycles.empty_state.general.description")}
              assetPath={resolvedPath}
              customPrimaryButton={
                <ComicBoxButton
                  label={t("project_cycles.empty_state.general.primary_button.text")}
                  title={t("project_cycles.empty_state.general.primary_button.comic.title")}
                  description={t("project_cycles.empty_state.general.primary_button.comic.description")}
                  data-ph-element={CYCLE_TRACKER_ELEMENTS.EMPTY_STATE_ADD_BUTTON}
                  onClick={() => {
                    setCreateModal(true);
                  }}
                  disabled={!hasMemberLevelPermission}
                />
              }
            />
          </div>
        ) : (
          <>
            {calculateTotalFilters(currentProjectFilters ?? {}) !== 0 && (
              <Header variant={EHeaderVariant.TERNARY}>
                <CycleAppliedFiltersList
                  appliedFilters={currentProjectFilters ?? {}}
                  handleClearAllFilters={() => clearAllFilters(projectId.toString())}
                  handleRemoveFilter={handleRemoveFilter}
                />
              </Header>
            )}

            <CyclesView workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
          </>
        )}
      </div>
    </>
  );
});

export default ProjectCyclesPage;
