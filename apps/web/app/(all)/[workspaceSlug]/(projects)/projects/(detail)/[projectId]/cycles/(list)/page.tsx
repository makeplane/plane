"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel, CYCLE_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TCycleFilters } from "@plane/types";
import { EUserProjectRoles } from "@plane/types";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import { calculateTotalFilters } from "@plane/utils";
import { PageHead } from "@/components/core/page-title";
import { CycleAppliedFiltersList } from "@/components/cycles/applied-filters";
import { CyclesView } from "@/components/cycles/cycles-view";
import { CycleCreateUpdateModal } from "@/components/cycles/modal";
import { ComicBoxButton } from "@/components/empty-state/comic-box-button";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { CycleModuleListLayoutLoader } from "@/components/ui/loader/cycle-module-list-loader";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useCycleFilter } from "@/hooks/store/use-cycle-filter";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

type ProjectCyclesPageProps = {
  params: {
    workspaceSlug: string;
    projectId: string;
  };
};

function ProjectCyclesPage({ params }: ProjectCyclesPageProps) {
  const { workspaceSlug, projectId } = params;
  // states
  const [createModal, setCreateModal] = useState(false);
  // store hooks
  const { currentProjectCycleIds, loader } = useCycle();
  const { getProjectById, currentProjectDetails } = useProject();
  // router
  const router = useAppRouter();
  // plane hooks
  const { t } = useTranslation();
  // cycle filters hook
  const { clearAllFilters, currentProjectFilters, updateFilters } = useCycleFilter();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const totalCycles = currentProjectCycleIds?.length ?? 0;
  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project?.name} - ${t("common.cycles", { count: 2 })}` : undefined;
  const hasAdminLevelPermission = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const hasMemberLevelPermission = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/disabled-feature/cycles" });

  const handleRemoveFilter = (key: keyof TCycleFilters, value: string | null) => {
    let newValues = currentProjectFilters?.[key] ?? [];

    if (!value) newValues = [];
    else newValues = newValues.filter((val) => val !== value);

    updateFilters(projectId, { [key]: newValues });
  };

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

  if (loader) return <CycleModuleListLayoutLoader />;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="w-full h-full">
        <CycleCreateUpdateModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
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
                  handleClearAllFilters={() => clearAllFilters(projectId)}
                  handleRemoveFilter={handleRemoveFilter}
                />
              </Header>
            )}

            <CyclesView workspaceSlug={workspaceSlug} projectId={projectId} />
          </>
        )}
      </div>
    </>
  );
}

export default observer(ProjectCyclesPage);
