"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { TCycleFilters } from "@plane/types";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import { PageHead } from "@/components/core";
import { CyclesView, CycleCreateUpdateModal, CycleAppliedFiltersList } from "@/components/cycles";
import { EmptyState } from "@/components/empty-state";
import { CycleModuleListLayout } from "@/components/ui";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useEventTracker, useCycle, useProject, useCycleFilter } from "@/hooks/store";

const ProjectCyclesPage = observer(() => {
  // states
  const [createModal, setCreateModal] = useState(false);
  // store hooks
  const { setTrackElement } = useEventTracker();
  const { currentProjectCycleIds, loader } = useCycle();
  const { getProjectById, currentProjectDetails } = useProject();
  // router
  const { workspaceSlug, projectId } = useParams();
  // cycle filters hook
  const { clearAllFilters, currentProjectFilters, updateFilters } = useCycleFilter();
  // derived values
  const totalCycles = currentProjectCycleIds?.length ?? 0;
  const project = projectId ? getProjectById(projectId?.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Cycles` : undefined;

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
        <EmptyState
          type={EmptyStateType.DISABLED_PROJECT_CYCLE}
          primaryButtonLink={`/${workspaceSlug}/projects/${projectId}/settings/features`}
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
