import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";
import dynamic from "next/dynamic";

import useSWR from "swr";

// headless ui
import { Tab } from "@headlessui/react";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// services
import cycleService from "services/cycles.service";
import projectService from "services/project.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// components
import { CompletedCyclesListProps, CreateUpdateCycleModal, CyclesList } from "components/cycles";
// ui
import { Loader, PrimaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { SelectCycleType } from "types";
import type { NextPage } from "next";
// fetch-keys
import {
  CYCLE_CURRENT_AND_UPCOMING_LIST,
  CYCLE_DRAFT_LIST,
  PROJECT_DETAILS,
} from "constants/fetch-keys";

const CompletedCyclesList = dynamic<CompletedCyclesListProps>(
  () => import("components/cycles").then((a) => a.CompletedCyclesList),
  {
    ssr: false,
    loading: () => (
      <Loader className="mb-5">
        <Loader.Item height="12rem" width="100%" />
      </Loader>
    ),
  }
);

const ProjectCycles: NextPage = () => {
  const [selectedCycle, setSelectedCycle] = useState<SelectCycleType>();
  const [createUpdateCycleModal, setCreateUpdateCycleModal] = useState(false);

  const { storedValue: cycleTab, setValue: setCycleTab } = useLocalStorage("cycleTab", "Upcoming");

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: draftCycles } = useSWR(
    workspaceSlug && projectId ? CYCLE_DRAFT_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => cycleService.getDraftCycles(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: currentAndUpcomingCycles } = useSWR(
    workspaceSlug && projectId ? CYCLE_CURRENT_AND_UPCOMING_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => cycleService.getCurrentAndUpcomingCycles(workspaceSlug as string, projectId as string)
      : null
  );

  useEffect(() => {
    if (createUpdateCycleModal) return;
    const timer = setTimeout(() => {
      setSelectedCycle(undefined);
      clearTimeout(timer);
    }, 500);
  }, [createUpdateCycleModal]);

  const currentTabValue = (tab: string | null) => {
    switch (tab) {
      case "Upcoming":
        return 0;
      case "Completed":
        return 1;
      case "Drafts":
        return 2;

      default:
        return 0;
    }
  };

  return (
    <ProjectAuthorizationWrapper
      meta={{
        title: "Plane - Cycles",
      }}
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
      />
      <div className="space-y-8">
        <div className="flex flex-col gap-5">
          {currentAndUpcomingCycles && currentAndUpcomingCycles.current_cycle.length > 0 && (
            <h3 className="text-3xl font-semibold text-black">Current Cycle</h3>
          )}
          <div className="space-y-5">
            <CyclesList
              cycles={currentAndUpcomingCycles?.current_cycle}
              setCreateUpdateCycleModal={setCreateUpdateCycleModal}
              setSelectedCycle={setSelectedCycle}
              type="current"
            />
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <h3 className="text-3xl font-semibold text-black">Other Cycles</h3>
          <div>
            <Tab.Group
              defaultIndex={currentTabValue(cycleTab)}
              onChange={(i) => {
                switch (i) {
                  case 0:
                    return setCycleTab("Upcoming");
                  case 1:
                    return setCycleTab("Completed");
                  case 2:
                    return setCycleTab("Drafts");

                  default:
                    return setCycleTab("Upcoming");
                }
              }}
            >
              <Tab.List
                as="div"
                className="flex items-center justify-start gap-4 text-base font-medium"
              >
                <Tab
                  className={({ selected }) =>
                    `rounded-3xl border px-5 py-1.5 text-sm outline-none sm:px-7 sm:py-2 sm:text-base ${
                      selected
                        ? "border-theme bg-theme text-white"
                        : "border-gray-300 bg-white hover:bg-hover-gray"
                    }`
                  }
                >
                  Upcoming
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `rounded-3xl border px-5 py-1.5 text-sm outline-none sm:px-7 sm:py-2 sm:text-base ${
                      selected
                        ? "border-theme bg-theme text-white"
                        : "border-gray-300 bg-white hover:bg-hover-gray"
                    }`
                  }
                >
                  Completed
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `rounded-3xl border px-5 py-1.5 text-sm outline-none sm:px-7 sm:py-2 sm:text-base ${
                      selected
                        ? "border-theme bg-theme text-white"
                        : "border-gray-300 bg-white hover:bg-hover-gray"
                    }`
                  }
                >
                  Drafts
                </Tab>
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel as="div" className="mt-8 space-y-5">
                  <CyclesList
                    cycles={currentAndUpcomingCycles?.upcoming_cycle}
                    setCreateUpdateCycleModal={setCreateUpdateCycleModal}
                    setSelectedCycle={setSelectedCycle}
                    type="upcoming"
                  />
                </Tab.Panel>
                <Tab.Panel as="div" className="mt-8 space-y-5">
                  <CompletedCyclesList
                    setCreateUpdateCycleModal={setCreateUpdateCycleModal}
                    setSelectedCycle={setSelectedCycle}
                  />
                </Tab.Panel>
                <Tab.Panel as="div" className="mt-8 space-y-5">
                  <CyclesList
                    cycles={draftCycles?.draft_cycles}
                    setCreateUpdateCycleModal={setCreateUpdateCycleModal}
                    setSelectedCycle={setSelectedCycle}
                    type="draft"
                  />
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      </div>
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectCycles;
