"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, EUserWorkspaceRoles } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TCycleFilters } from "@plane/types";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import { PageHead } from "@/components/core";
import { CyclesView, CycleCreateUpdateModal, CycleAppliedFiltersList } from "@/components/cycles";
import { DetailedEmptyState, EmptyState } from "@/components/empty-state";
import { CycleModuleListLayout } from "@/components/ui";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useEventTracker, useCycle, useProject, useCycleFilter, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

const ProjectCyclesPage = observer(() => {
  // states
  const [createModal, setCreateModal] = useState(false);
  // store hooks
  const { setTrackElement } = useEventTracker();
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
  const pageTitle = project?.name ? `${project?.name} - Cycles` : undefined;
  const canPerformEmptyStateActions = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.PROJECT);
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
              router.push(`/${workspaceSlug}/projects/${projectId}/settings/features`);
            },
            disabled: !canPerformEmptyStateActions,
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
            <EmptyState
              type={EmptyStateType.PROJECT_CYCLES}
              primaryButtonOnClick={() => {
                setTrackElement("Cycle empty state");
                setCreateModal(true);
              }}
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
