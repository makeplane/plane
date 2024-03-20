import { Fragment, useState, ReactElement } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { Tab } from "@headlessui/react";
import { TCycleFilters } from "@plane/types";
// hooks
import { PageHead } from "@/components/core";
import {
  CyclesView,
  CycleCreateUpdateModal,
  CyclesViewHeader,
  CycleAppliedFiltersList,
  ActiveCycleRoot,
} from "@/components/cycles";
import CyclesListMobileHeader from "@/components/cycles/cycles-list-mobile-header";
import { EmptyState } from "@/components/empty-state";
import { CyclesHeader } from "@/components/headers";
import { CycleModuleBoardLayout, CycleModuleListLayout, GanttLayoutLoader } from "@/components/ui";
import { CYCLE_TABS_LIST } from "@/constants/cycle";
import { EmptyStateType } from "@/constants/empty-state";
import { calculateTotalFilters } from "@/helpers/filter.helper";
import { useEventTracker, useCycle, useProject, useCycleFilter } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
// components
// ui
// helpers
// types
import { NextPageWithLayout } from "@/lib/types";
// constants

const ProjectCyclesPage: NextPageWithLayout = observer(() => {
  // states
  const [createModal, setCreateModal] = useState(false);
  // store hooks
  const { setTrackElement } = useEventTracker();
  const { currentProjectCycleIds, loader } = useCycle();
  const { getProjectById } = useProject();
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, peekCycle } = router.query;
  // cycle filters hook
  const { clearAllFilters, currentProjectDisplayFilters, currentProjectFilters, updateDisplayFilters, updateFilters } =
    useCycleFilter();
  // derived values
  const totalCycles = currentProjectCycleIds?.length ?? 0;
  const project = projectId ? getProjectById(projectId?.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Cycles` : undefined;
  // selected display filters
  const cycleTab = currentProjectDisplayFilters?.active_tab;
  const cycleLayout = currentProjectDisplayFilters?.layout ?? "list";

  const handleRemoveFilter = (key: keyof TCycleFilters, value: string | null) => {
    if (!projectId) return;
    let newValues = currentProjectFilters?.[key] ?? [];

    if (!value) newValues = [];
    else newValues = newValues.filter((val) => val !== value);

    updateFilters(projectId.toString(), { [key]: newValues });
  };

  if (!workspaceSlug || !projectId) return null;

  if (loader)
    return (
      <>
        {cycleLayout === "list" && <CycleModuleListLayout />}
        {cycleLayout === "board" && <CycleModuleBoardLayout />}
        {cycleLayout === "gantt" && <GanttLayoutLoader />}
      </>
    );

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
          <Tab.Group
            as="div"
            className="flex h-full flex-col overflow-hidden"
            defaultIndex={CYCLE_TABS_LIST.findIndex((i) => i.key == cycleTab)}
            selectedIndex={CYCLE_TABS_LIST.findIndex((i) => i.key == cycleTab)}
            onChange={(i) => {
              if (!projectId) return;
              const tab = CYCLE_TABS_LIST[i];
              if (!tab) return;
              updateDisplayFilters(projectId.toString(), {
                active_tab: tab.key,
              });
            }}
          >
            <CyclesViewHeader projectId={projectId.toString()} />
            {calculateTotalFilters(currentProjectFilters ?? {}) !== 0 && (
              <div className="border-b border-custom-border-200 px-5 py-3">
                <CycleAppliedFiltersList
                  appliedFilters={currentProjectFilters ?? {}}
                  handleClearAllFilters={() => clearAllFilters(projectId.toString())}
                  handleRemoveFilter={handleRemoveFilter}
                />
              </div>
            )}
            <Tab.Panels as={Fragment}>
              <Tab.Panel as="div" className="h-full space-y-5 overflow-y-auto p-4 sm:p-5">
                <ActiveCycleRoot workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
              </Tab.Panel>
              <Tab.Panel as="div" className="h-full overflow-y-auto">
                <CyclesView
                  layout={cycleLayout}
                  workspaceSlug={workspaceSlug.toString()}
                  projectId={projectId.toString()}
                  peekCycle={peekCycle?.toString()}
                />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
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
