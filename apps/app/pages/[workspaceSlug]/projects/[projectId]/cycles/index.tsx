import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Tab } from "@headlessui/react";
// hooks
import useLocalStorage from "hooks/use-local-storage";
import useUserAuth from "hooks/use-user-auth";
// services
import projectService from "services/project.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// components
import {
  ActiveCycleDetails,
  AllCyclesList,
  CompletedCyclesList,
  CreateUpdateCycleModal,
  DraftCyclesList,
  UpcomingCyclesList,
} from "components/cycles";
// ui
import { PrimaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { ListBulletIcon, PlusIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
// types
import { SelectCycleType } from "types";
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS } from "constants/fetch-keys";

const tabsList = ["All", "Active", "Upcoming", "Completed", "Drafts"];

const ProjectCycles: NextPage = () => {
  const [selectedCycle, setSelectedCycle] = useState<SelectCycleType>();
  const [createUpdateCycleModal, setCreateUpdateCycleModal] = useState(false);

  const { storedValue: cycleTab, setValue: setCycleTab } = useLocalStorage("cycleTab", "All");
  const { storedValue: cyclesView, setValue: setCyclesView } = useLocalStorage("cycleView", "list");

  const currentTabValue = (tab: string | null) => {
    switch (tab) {
      case "All":
        return 0;
      case "Active":
        return 1;
      case "Upcoming":
        return 2;
      case "Completed":
        return 3;
      case "Drafts":
        return 4;
      default:
        return 0;
    }
  };

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  useEffect(() => {
    if (createUpdateCycleModal) return;
    const timer = setTimeout(() => {
      setSelectedCycle(undefined);
      clearTimeout(timer);
    }, 500);
  }, [createUpdateCycleModal]);

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Cycles`} />
        </Breadcrumbs>
      }
      right={
        <PrimaryButton
          className="flex items-center gap-2"
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "q" });
            document.dispatchEvent(e);
          }}
        >
          <PlusIcon className="h-4 w-4" />
          Add Cycle
        </PrimaryButton>
      }
    >
      <CreateUpdateCycleModal
        isOpen={createUpdateCycleModal}
        handleClose={() => setCreateUpdateCycleModal(false)}
        data={selectedCycle}
        user={user}
      />
      <div className="space-y-5 p-8 h-full flex flex-col overflow-hidden">
        <div className="flex gap-4 justify-between">
          <h3 className="text-2xl font-semibold text-custom-text-100">Cycles</h3>
          <div className="flex items-center gap-x-1">
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-background-80 ${
                cyclesView === "list" ? "bg-custom-background-80" : ""
              }`}
              onClick={() => setCyclesView("list")}
            >
              <ListBulletIcon className="h-4 w-4 text-custom-text-200" />
            </button>
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-background-80 ${
                cyclesView === "board" ? "bg-custom-background-80" : ""
              }`}
              onClick={() => setCyclesView("board")}
            >
              <Squares2X2Icon className="h-4 w-4 text-custom-text-200" />
            </button>
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded outline-none duration-300 hover:bg-custom-background-80 ${
                cyclesView === "gantt_chart" ? "bg-custom-background-80" : ""
              }`}
              onClick={() => {
                setCyclesView("gantt_chart");
                setCycleTab("All");
              }}
            >
              <span className="material-symbols-rounded text-custom-text-200 text-[18px] rotate-90">
                waterfall_chart
              </span>
            </button>
          </div>
        </div>
        <Tab.Group
          as={React.Fragment}
          defaultIndex={currentTabValue(cycleTab)}
          selectedIndex={currentTabValue(cycleTab)}
          onChange={(i) => {
            switch (i) {
              case 0:
                return setCycleTab("All");
              case 1:
                return setCycleTab("Active");
              case 2:
                return setCycleTab("Upcoming");
              case 3:
                return setCycleTab("Completed");
              case 4:
                return setCycleTab("Drafts");
              default:
                return setCycleTab("All");
            }
          }}
        >
          <Tab.List as="div" className="flex flex-wrap items-center justify-start gap-4 text-base">
            {tabsList.map((tab, index) => {
              if (cyclesView === "gantt_chart" && (tab === "Active" || tab === "Drafts"))
                return null;

              return (
                <Tab
                  key={index}
                  className={({ selected }) =>
                    `rounded-3xl border px-6 py-1 outline-none ${
                      selected
                        ? "border-custom-primary bg-custom-primary text-white font-medium"
                        : "border-custom-border-300 bg-custom-background-100 hover:bg-custom-background-80"
                    }`
                  }
                >
                  {tab}
                </Tab>
              );
            })}
          </Tab.List>
          <Tab.Panels as={React.Fragment}>
            <Tab.Panel as="div" className="h-full overflow-y-auto">
              <AllCyclesList viewType={cyclesView} />
            </Tab.Panel>
            {cyclesView !== "gantt_chart" && (
              <Tab.Panel as="div" className="mt-7 space-y-5 h-full overflow-y-auto">
                <ActiveCycleDetails />
              </Tab.Panel>
            )}
            <Tab.Panel as="div" className="h-full overflow-y-auto">
              <UpcomingCyclesList viewType={cyclesView} />
            </Tab.Panel>
            <Tab.Panel as="div" className="h-full overflow-y-auto">
              <CompletedCyclesList viewType={cyclesView} />
            </Tab.Panel>
            {cyclesView !== "gantt_chart" && (
              <Tab.Panel as="div" className="h-full overflow-y-auto">
                <DraftCyclesList viewType={cyclesView} />
              </Tab.Panel>
            )}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectCycles;
