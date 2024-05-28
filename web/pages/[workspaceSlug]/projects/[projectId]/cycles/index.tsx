import { useState, ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import { TCycleFilters } from "@plane/types";
// components
import { PageHead } from "@/components/core";
import { CyclesView, CycleCreateUpdateModal, CycleAppliedFiltersList } from "@/components/cycles";
import CyclesListMobileHeader from "@/components/cycles/cycles-list-mobile-header";
import { EmptyState } from "@/components/empty-state";
import { CyclesHeader } from "@/components/headers";
import { CycleModuleListLayout } from "@/components/ui";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useEventTracker, useCycle, useProject, useCycleFilter } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
// types
import { NextPageWithLayout } from "@/lib/types";

const ProjectCyclesPage: NextPageWithLayout = observer(() => {
  // states
  const [createModal, setCreateModal] = useState(false);
  // store hooks
  const { setTrackElement } = useEventTracker();
  const { currentProjectCycleIds, loader } = useCycle();
  const { getProjectById, currentProjectDetails } = useProject();
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
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
              <div className="border-b border-custom-border-200 px-5 py-3">
                <CycleAppliedFiltersList
                  appliedFilters={currentProjectFilters ?? {}}
                  handleClearAllFilters={() => clearAllFilters(projectId.toString())}
                  handleRemoveFilter={handleRemoveFilter}
                />
              </div>
            )}

            <CyclesView workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
          </>
        )}
      </div>
    </>
  );
});

ProjectCyclesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<CyclesHeader />} mobileHeader={<CyclesListMobileHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectCyclesPage;
