import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Tab } from "@headlessui/react";
import useSWR from "swr";
// hooks
import useLocalStorage from "hooks/use-local-storage";
import useUserAuth from "hooks/use-user-auth";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// components
import { CyclesView, ActiveCycleDetails, CreateUpdateCycleModal } from "components/cycles";
// ui
import { Button } from "@plane/ui";
import { EmptyState } from "components/common";
import { Icon } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// images
import emptyCycle from "public/empty-state/cycle.svg";
// types
import { SelectCycleType } from "types";
import type { NextPage } from "next";
// helper
import { truncateText } from "helpers/string.helper";
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";
// constants
import { CYCLE_TAB_LIST, CYCLE_VIEWS } from "constants/cycle";

type ICycleAPIFilter = "all" | "current" | "upcoming" | "draft" | "completed" | "incomplete";
type ICycleView = "list" | "board" | "gantt";

const ProjectCyclesPage: NextPage = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store
  const { project: projectStore } = useMobxStore();
  const projectDetails = projectId ? projectStore.project_details[projectId.toString()] : null;
  // states
  const [selectedCycle, setSelectedCycle] = useState<SelectCycleType>();
  const [createUpdateCycleModal, setCreateUpdateCycleModal] = useState(false);
  // local storage
  const { storedValue: cycleTab, setValue: setCycleTab } = useLocalStorage("cycle_tab", "all");
  const { storedValue: cyclesView, setValue: setCyclesView } = useLocalStorage("cycle_view", "list");
  // hooks
  const { user } = useUserAuth();
  // api call fetch project details
  useSWR(
    workspaceSlug && projectId ? `PROJECT_DETAILS_${projectId}` : null,
    workspaceSlug && projectId
      ? () => {
          projectStore.fetchProjectDetails(workspaceSlug.toString(), projectId.toString());
        }
      : null
  );

  /**
   * Clearing form data after closing the modal
   */
  useEffect(() => {
    if (createUpdateCycleModal) return;

    const timer = setTimeout(() => {
      setSelectedCycle(undefined);
      clearTimeout(timer);
    }, 500);
  }, [createUpdateCycleModal]);

  useEffect(() => {
    if (cycleTab === "draft" && cyclesView === "gantt") {
      setCyclesView("list");
    }
  }, [cycleTab, cyclesView, setCyclesView]);

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
          prependIcon={<PlusIcon />}
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "q" });
            document.dispatchEvent(e);
          }}
        >
          Add Cycle
        </Button>
      }
    >
      <CreateUpdateCycleModal
        isOpen={createUpdateCycleModal}
        handleClose={() => setCreateUpdateCycleModal(false)}
        data={selectedCycle}
        user={user}
      />
      {projectDetails?.total_cycles === 0 ? (
        <div className="h-full grid place-items-center">
          <EmptyState
            title="Plan your project with cycles"
            description="Cycle is a custom time period in which a team works to complete items on their backlog."
            image={emptyCycle}
            primaryButton={{
              icon: <PlusIcon className="h-4 w-4" />,
              text: "New Cycle",
              onClick: () => {
                const e = new KeyboardEvent("keydown", {
                  key: "q",
                });
                document.dispatchEvent(e);
              },
            }}
          />
        </div>
      ) : (
        <Tab.Group
          as="div"
          className="h-full flex flex-col overflow-hidden"
          defaultIndex={CYCLE_TAB_LIST.findIndex((i) => i.key === cycleTab)}
          selectedIndex={CYCLE_TAB_LIST.findIndex((i) => i.key === cycleTab)}
          onChange={(i) => {
            try {
              setCycleTab(CYCLE_TAB_LIST[i].key);
            } catch (e) {
              setCycleTab(CYCLE_TAB_LIST[0].key);
            }
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
            <div className="justify-end sm:justify-start flex items-center gap-x-1">
              {CYCLE_VIEWS.map((view) => {
                if (cycleTab === "active") return null;
                if (view.key === "gantt" && cycleTab === "draft") return null;

                return (
                  <button
                    key={view.key}
                    type="button"
                    className={`grid h-8 w-8 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-background-80 ${
                      cyclesView === view.key ? "bg-custom-background-80 text-custom-text-100" : "text-custom-text-200"
                    }`}
                    onClick={() => setCyclesView(view.key)}
                  >
                    <Icon iconName={view.icon} className="!text-base" />
                  </button>
                );
              })}
            </div>
          </div>
          <Tab.Panels as={React.Fragment}>
            <Tab.Panel as="div" className="p-4 sm:p-5 h-full overflow-y-auto">
              {cycleTab && cyclesView && workspaceSlug && projectId && (
                <CyclesView
                  filter="all"
                  view={cyclesView as ICycleView}
                  workspaceSlug={workspaceSlug?.toString()}
                  projectId={projectId?.toString()}
                />
              )}
            </Tab.Panel>
            <Tab.Panel as="div" className="p-4 sm:p-5 space-y-5 h-full overflow-y-auto">
              <ActiveCycleDetails />
            </Tab.Panel>
            <Tab.Panel as="div" className="p-4 sm:p-5 h-full overflow-y-auto">
              {cycleTab && cyclesView && workspaceSlug && projectId && (
                <CyclesView
                  filter="upcoming"
                  view={cyclesView as ICycleView}
                  workspaceSlug={workspaceSlug?.toString()}
                  projectId={projectId?.toString()}
                />
              )}
            </Tab.Panel>
            <Tab.Panel as="div" className="p-4 sm:p-5 h-full overflow-y-auto">
              {cycleTab && cyclesView && workspaceSlug && projectId && (
                <CyclesView
                  filter="completed"
                  view={cyclesView as ICycleView}
                  workspaceSlug={workspaceSlug?.toString()}
                  projectId={projectId?.toString()}
                />
              )}
            </Tab.Panel>
            <Tab.Panel as="div" className="p-4 sm:p-5 h-full overflow-y-auto">
              {cycleTab && cyclesView && workspaceSlug && projectId && (
                <CyclesView
                  filter="draft"
                  view={cyclesView as ICycleView}
                  workspaceSlug={workspaceSlug?.toString()}
                  projectId={projectId?.toString()}
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
