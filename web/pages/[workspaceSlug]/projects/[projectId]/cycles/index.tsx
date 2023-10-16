import { Fragment, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Tab } from "@headlessui/react";
import useSWR from "swr";
import { Plus } from "lucide-react";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// components
import { CyclesView, ActiveCycleDetails } from "components/cycles";
import { CycleCreateEditModal } from "components/cycles/cycle-create-edit-modal";
// ui
import { Button } from "@plane/ui";
import { EmptyState } from "components/common";
import { Icon } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// images
import emptyCycle from "public/empty-state/cycle.svg";
// types
import { TCycleView, TCycleLayout } from "types";
import type { NextPage } from "next";
// helper
import { truncateText } from "helpers/string.helper";
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";
// constants
import { CYCLE_TAB_LIST, CYCLE_VIEWS } from "constants/cycle";
// lib cookie
import { setLocalStorage, getLocalStorage } from "lib/local-storage";

const ProjectCyclesPage: NextPage = observer(() => {
  const [createModal, setCreateModal] = useState(false);
  const createOnSubmit = () => {};

  // store
  const { project: projectStore, cycle: cycleStore } = useMobxStore();

  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  useSWR(
    workspaceSlug && projectId ? `PROJECT_DETAILS_${projectId}` : null,
    workspaceSlug && projectId ? () => projectStore.fetchProjectDetails(workspaceSlug, projectId) : null
  );

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

  const projectDetails = projectId ? projectStore.project_details[projectId] : null;
  const cycleView = cycleStore?.cycleView;
  const cycleLayout = cycleStore?.cycleLayout;

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${truncateText(projectDetails?.name ?? "Project", 32)} Cycles`} />
        </Breadcrumbs>
      }
      right={
        <Button
          variant="primary"
          prependIcon={<Plus />}
          onClick={() => {
            setCreateModal(true);
          }}
        >
          Add Cycle
        </Button>
      }
    >
      <CycleCreateEditModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        modal={createModal}
        modalClose={() => setCreateModal(false)}
        onSubmit={createOnSubmit}
      />

      {projectDetails?.total_cycles === 0 ? (
        <div className="h-full grid place-items-center">
          <EmptyState
            title="Plan your project with cycles"
            description="Cycle is a custom time period in which a team works to complete items on their backlog."
            image={emptyCycle}
            primaryButton={{
              icon: <Plus className="h-4 w-4" />,
              text: "New Cycle",
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
          <div className="flex flex-col sm:flex-row gap-4 justify-between border-b border-custom-border-300 px-4 sm:px-5 pb-4 sm:pb-0">
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
            {CYCLE_VIEWS && CYCLE_VIEWS.length > 0 && cycleStore?.cycleView != "active" && (
              <div className="justify-end sm:justify-start flex items-center gap-x-1">
                {CYCLE_VIEWS.map((view) => {
                  if (view.key === "gantt" && cycleStore?.cycleView === "draft") return null;
                  return (
                    <button
                      key={view.key}
                      type="button"
                      className={`grid h-8 w-8 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-background-80 ${
                        cycleStore?.cycleLayout === view.key
                          ? "bg-custom-background-80 text-custom-text-100"
                          : "text-custom-text-200"
                      }`}
                      onClick={() => handleCurrentLayout(view.key as TCycleLayout)}
                    >
                      <Icon iconName={view.icon} className="!text-base" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Tab.Panels as={Fragment}>
            <Tab.Panel as="div" className="p-4 sm:p-5 h-full overflow-y-auto">
              {cycleView && cycleLayout && workspaceSlug && projectId && (
                <CyclesView
                  filter={"all"}
                  layout={cycleLayout as TCycleLayout}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                />
              )}
            </Tab.Panel>

            <Tab.Panel as="div" className="p-4 sm:p-5 space-y-5 h-full overflow-y-auto">
              <ActiveCycleDetails workspaceSlug={workspaceSlug} projectId={projectId} />
            </Tab.Panel>

            <Tab.Panel as="div" className="p-4 sm:p-5 h-full overflow-y-auto">
              {cycleView && cycleLayout && workspaceSlug && projectId && (
                <CyclesView
                  filter={"upcoming"}
                  layout={cycleLayout as TCycleLayout}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                />
              )}
            </Tab.Panel>

            <Tab.Panel as="div" className="p-4 sm:p-5 h-full overflow-y-auto">
              {cycleView && cycleLayout && workspaceSlug && projectId && (
                <CyclesView
                  filter={"completed"}
                  layout={cycleLayout as TCycleLayout}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                />
              )}
            </Tab.Panel>

            <Tab.Panel as="div" className="p-4 sm:p-5 h-full overflow-y-auto">
              {cycleView && cycleLayout && workspaceSlug && projectId && (
                <CyclesView
                  filter={"draft"}
                  layout={cycleLayout as TCycleLayout}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                />
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      )}
    </ProjectAuthorizationWrapper>
  );
});

export default ProjectCyclesPage;
