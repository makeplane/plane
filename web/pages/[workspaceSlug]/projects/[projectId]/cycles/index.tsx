import { Fragment, useState, ReactElement } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { Tab } from "@headlessui/react";
// hooks
import { useEventTracker, useCycle, useProject } from "hooks/store";
import useCycleFilters from "hooks/use-cycle-filters";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { PageHead } from "components/core";
import { CyclesHeader } from "components/headers";
import {
  CyclesView,
  CycleCreateUpdateModal,
  CyclesViewHeader,
  CycleAppliedFiltersList,
  ActiveCycleRoot,
} from "components/cycles";
import { EmptyState } from "components/empty-state";
// ui
import { CycleModuleBoardLayout, CycleModuleListLayout, GanttLayoutLoader } from "components/ui";
// helpers
import { calculateTotalFilters } from "helpers/filter.helper";
// types
import { NextPageWithLayout } from "lib/types";
import { TCycleFilters } from "@plane/types";
// constants
import { CYCLE_TABS_LIST } from "constants/cycle";
import { EmptyStateType } from "constants/empty-state";

const ProjectCyclesPage: NextPageWithLayout = observer(() => {
  // states
  const [createModal, setCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // store hooks
  const { setTrackElement } = useEventTracker();
  const { currentProjectCycleIds, loader } = useCycle();
  const { getProjectById } = useProject();
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, peekCycle } = router.query;
  // cycle filters hook
  const { clearAllFilters, filters, displayFilters, handleUpdateDisplayFilters, handleUpdateFilters } = useCycleFilters(
    projectId?.toString() ?? ""
  );
  // derived values
  const totalCycles = currentProjectCycleIds?.length ?? 0;
  const project = projectId ? getProjectById(projectId?.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Cycles` : undefined;
  // selected display filters
  const cycleTab = displayFilters?.active_tab;
  const cycleLayout = displayFilters?.layout;

  const handleRemoveFilter = (key: keyof TCycleFilters, value: string | null) => {
    let newValues = filters?.[key] ?? [];

    if (!value) newValues = [];
    else newValues = newValues.filter((val) => val !== value);

    handleUpdateFilters({ [key]: newValues });
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
              const tab = CYCLE_TABS_LIST[i];
              if (!tab) return;
              handleUpdateDisplayFilters({
                active_tab: tab.key,
              });
            }}
          >
            <CyclesViewHeader
              handleUpdateSearchQuery={(val) => setSearchQuery(val)}
              projectId={projectId.toString()}
              searchQuery={searchQuery}
            />
            {calculateTotalFilters(filters ?? {}) !== 0 && (
              <div className="border-b border-custom-border-200 px-5 py-3">
                <CycleAppliedFiltersList
                  appliedFilters={filters ?? {}}
                  handleClearAllFilters={clearAllFilters}
                  handleRemoveFilter={handleRemoveFilter}
                />
              </div>
            )}
            <Tab.Panels as={Fragment}>
              <Tab.Panel as="div" className="h-full space-y-5 overflow-y-auto p-4 sm:p-5">
                <ActiveCycleRoot workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
              </Tab.Panel>
              <Tab.Panel as="div" className="h-full overflow-y-auto">
                {cycleTab && cycleLayout && (
                  <CyclesView
                    layout={cycleLayout}
                    workspaceSlug={workspaceSlug.toString()}
                    projectId={projectId.toString()}
                    peekCycle={peekCycle?.toString()}
                    searchQuery={searchQuery}
                  />
                )}
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
    <AppLayout header={<CyclesHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectCyclesPage;
