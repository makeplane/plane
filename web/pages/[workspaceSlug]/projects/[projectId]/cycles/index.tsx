import { Fragment, useCallback, useEffect, useState, ReactElement } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Tab } from "@headlessui/react";
import { Plus } from "lucide-react";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { CyclesHeader } from "components/headers";
import { CyclesView, ActiveCycleDetails, CycleCreateUpdateModal } from "components/cycles";
// ui
import { Tooltip } from "@plane/ui";
// images
import emptyCycle from "public/empty-state/empty_cycles.webp";
// types
import { TCycleView, TCycleLayout } from "types";
import { NextPageWithLayout } from "types/app";
// constants
import { CYCLE_TAB_LIST, CYCLE_VIEW_LAYOUTS } from "constants/cycle";
// lib cookie
import { setLocalStorage, getLocalStorage } from "lib/local-storage";
import { NewEmptyState } from "components/common/new-empty-state";
// TODO: use-local-storage  hook instead of lib file.

const ProjectCyclesPage: NextPageWithLayout = observer(() => {
  const [createModal, setCreateModal] = useState(false);
  // store
  const { cycle: cycleStore } = useMobxStore();
  const { projectCycles } = cycleStore;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, peekCycle } = router.query;

  const handleCurrentLayout = useCallback(
    (_layout: TCycleLayout) => {
      if (projectId) {
        setLocalStorage(`cycle_layout:${projectId}`, _layout);
        cycleStore.setCycleLayout(_layout);
      }
    },
    [cycleStore, projectId]
  );

  const handleCurrentView = useCallback(
    (_view: TCycleView) => {
      if (projectId) {
        setLocalStorage(`cycle_view:${projectId}`, _view);
        cycleStore.setCycleView(_view);
        if (_view === "draft" && cycleStore.cycleLayout === "gantt") {
          handleCurrentLayout("list");
        }
      }
    },
    [cycleStore, projectId, handleCurrentLayout]
  );

  useEffect(() => {
    if (projectId) {
      const _viewKey = `cycle_view:${projectId}`;
      const _viewValue = getLocalStorage(_viewKey);
      if (_viewValue && _viewValue !== cycleStore?.cycleView) cycleStore.setCycleView(_viewValue as TCycleView);
      else handleCurrentView("all");

      const _layoutKey = `cycle_layout:${projectId}`;
      const _layoutValue = getLocalStorage(_layoutKey);
      if (_layoutValue && _layoutValue !== cycleStore?.cycleView)
        cycleStore.setCycleLayout(_layoutValue as TCycleLayout);
      else handleCurrentLayout("list");
    }
  }, [projectId, cycleStore, handleCurrentView, handleCurrentLayout]);

  const cycleView = cycleStore?.cycleView;
  const cycleLayout = cycleStore?.cycleLayout;
  const totalCycles = projectCycles?.length ?? 0;

  if (!workspaceSlug || !projectId) return null;

  return (
    <>
      <CycleCreateUpdateModal
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
        isOpen={createModal}
        handleClose={() => setCreateModal(false)}
      />
      {totalCycles === 0 ? (
        <div className="h-full grid place-items-center">
          <NewEmptyState
            title="Group and timebox your work in Cycles."
            description="Break work down by timeboxed chunks, work backwards from your project deadline to set dates, and make tangible progress as a team."
            image={emptyCycle}
            comicBox={{
              title: "Cycles are repetitive time-boxes.",
              direction: "right",
              description:
                "A sprint, an iteration, and or any other term you use for weekly or fortnightly tracking of work is a cycle.",
            }}
            primaryButton={{
              icon: <Plus className="h-4 w-4" />,
              text: "Set your first cycle",
              onClick: () => {
                setCreateModal(true);
              },
            }}
          />
        </div>
      ) : (
        <Tab.Group
          as="div"
          className="h-full flex flex-col overflow-hidden"
          defaultIndex={CYCLE_TAB_LIST.findIndex((i) => i.key == cycleStore?.cycleView)}
          selectedIndex={CYCLE_TAB_LIST.findIndex((i) => i.key == cycleStore?.cycleView)}
          onChange={(i) => {
            handleCurrentView(CYCLE_TAB_LIST[i].key as TCycleView);
          }}
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-end sm:items-center border-b border-custom-border-200 px-4 sm:px-5 pb-4 sm:pb-0">
            <Tab.List as="div" className="flex items-center overflow-x-scroll">
              {CYCLE_TAB_LIST.map((tab) => (
                <Tab
                  key={tab.key}
                  className={({ selected }) =>
                    `border-b-2 p-4 text-sm font-medium outline-none ${
                      selected ? "border-custom-primary-100 text-custom-primary-100" : "border-transparent"
                    }`
                  }
                >
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>
            {cycleStore?.cycleView != "active" && (
              <div className="flex items-center gap-1 p-1 rounded bg-custom-background-80">
                {CYCLE_VIEW_LAYOUTS.map((layout) => {
                  if (layout.key === "gantt" && cycleStore?.cycleView === "draft") return null;

                  return (
                    <Tooltip key={layout.key} tooltipContent={layout.title}>
                      <button
                        type="button"
                        className={`w-7 h-[22px] rounded grid place-items-center transition-all hover:bg-custom-background-100 overflow-hidden group ${
                          cycleStore?.cycleLayout == layout.key
                            ? "bg-custom-background-100 shadow-custom-shadow-2xs"
                            : ""
                        }`}
                        onClick={() => handleCurrentLayout(layout.key as TCycleLayout)}
                      >
                        <layout.icon
                          strokeWidth={2}
                          className={`h-3.5 w-3.5 ${
                            cycleStore?.cycleLayout == layout.key ? "text-custom-text-100" : "text-custom-text-200"
                          }`}
                        />
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </div>

          <Tab.Panels as={Fragment}>
            <Tab.Panel as="div" className="h-full overflow-y-auto">
              {cycleView && cycleLayout && (
                <CyclesView
                  filter={"all"}
                  layout={cycleLayout as TCycleLayout}
                  workspaceSlug={workspaceSlug.toString()}
                  projectId={projectId.toString()}
                  peekCycle={peekCycle?.toString()}
                />
              )}
            </Tab.Panel>

            <Tab.Panel as="div" className="p-4 sm:p-5 space-y-5 h-full overflow-y-auto">
              <ActiveCycleDetails workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
            </Tab.Panel>

            <Tab.Panel as="div" className="h-full overflow-y-auto">
              {cycleView && cycleLayout && (
                <CyclesView
                  filter={"upcoming"}
                  layout={cycleLayout as TCycleLayout}
                  workspaceSlug={workspaceSlug.toString()}
                  projectId={projectId.toString()}
                  peekCycle={peekCycle?.toString()}
                />
              )}
            </Tab.Panel>

            <Tab.Panel as="div" className="h-full overflow-y-auto">
              {cycleView && cycleLayout && workspaceSlug && projectId && (
                <CyclesView
                  filter={"completed"}
                  layout={cycleLayout as TCycleLayout}
                  workspaceSlug={workspaceSlug.toString()}
                  projectId={projectId.toString()}
                  peekCycle={peekCycle?.toString()}
                />
              )}
            </Tab.Panel>

            <Tab.Panel as="div" className="h-full overflow-y-auto">
              {cycleView && cycleLayout && workspaceSlug && projectId && (
                <CyclesView
                  filter={"draft"}
                  layout={cycleLayout as TCycleLayout}
                  workspaceSlug={workspaceSlug.toString()}
                  projectId={projectId.toString()}
                  peekCycle={peekCycle?.toString()}
                />
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      )}
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
