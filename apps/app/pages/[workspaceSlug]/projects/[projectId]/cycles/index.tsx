import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

// headless ui
import { Tab } from "@headlessui/react";
// hooks
import useLocalStorage from "hooks/use-local-storage";
import useUserAuth from "hooks/use-user-auth";
import useProjectDetails from "hooks/use-project-details";
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
import { EmptyState, Icon, PrimaryButton } from "components/ui";
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

const tabsList = ["All", "Active", "Upcoming", "Completed", "Drafts"];

const cycleViews = [
  {
    key: "list",
    icon: "list",
  },
  {
    key: "board",
    icon: "dataset",
  },
  {
    key: "gantt",
    icon: "view_timeline",
  },
];

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
  const { workspaceSlug } = router.query;

  const { user } = useUserAuth();
  const { projectDetails } = useProjectDetails();

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
          <BreadcrumbItem title={`${truncateText(projectDetails?.name ?? "Project", 32)} Cycles`} />
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
      {projectDetails?.total_cycles === 0 ? (
        <div className="h-full grid place-items-center">
          <EmptyState
            title="Plan your project with cycles"
            description="Cycle is a custom time period in which a team works to complete items on their backlog."
            image={emptyCycle}
            buttonText="New Cycle"
            buttonIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => {
              const e = new KeyboardEvent("keydown", {
                key: "q",
              });
              document.dispatchEvent(e);
            }}
          />
        </div>
      ) : (
        <Tab.Group
          as="div"
          className="h-full flex flex-col overflow-hidden"
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
          <div className="flex flex-col sm:flex-row gap-4 justify-between border-b border-custom-border-300 px-4 sm:px-5 pb-4 sm:pb-0">
            <Tab.List as="div" className="flex items-center overflow-x-scroll">
              {tabsList.map((tab, index) => {
                if (cyclesView === "gantt_chart" && (tab === "Active" || tab === "Drafts"))
                  return null;

                return (
                  <Tab
                    key={index}
                    className={({ selected }) =>
                      `border-b-2 p-4 text-sm font-medium outline-none ${
                        selected
                          ? "border-custom-primary-100 text-custom-primary-100"
                          : "border-transparent"
                      }`
                    }
                  >
                    {tab}
                  </Tab>
                );
              })}
            </Tab.List>
            <div className="justify-end sm:justify-start flex items-center gap-x-1">
              {cycleViews.map((view) => {
                if (cycleTab === "Active") return null;
                if (view.key === "gantt" && cycleTab === "Drafts") return null;

                return (
                  <button
                    key={view.key}
                    type="button"
                    className={`grid h-8 w-8 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-background-80 ${
                      cyclesView === view.key
                        ? "bg-custom-background-80 text-custom-text-100"
                        : "text-custom-text-200"
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
              <AllCyclesList viewType={cyclesView} />
            </Tab.Panel>
            {cyclesView !== "gantt_chart" && (
              <Tab.Panel as="div" className="p-4 sm:p-5 space-y-5 h-full overflow-y-auto">
                <ActiveCycleDetails />
              </Tab.Panel>
            )}
            <Tab.Panel as="div" className="p-4 sm:p-5 h-full overflow-y-auto">
              <UpcomingCyclesList viewType={cyclesView} />
            </Tab.Panel>
            <Tab.Panel as="div" className="p-4 sm:p-5 h-full overflow-y-auto">
              <CompletedCyclesList viewType={cyclesView} />
            </Tab.Panel>
            {cyclesView !== "gantt_chart" && (
              <Tab.Panel as="div" className="p-4 sm:p-5 h-full overflow-y-auto">
                <DraftCyclesList viewType={cyclesView} />
              </Tab.Panel>
            )}
          </Tab.Panels>
        </Tab.Group>
      )}
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectCycles;
