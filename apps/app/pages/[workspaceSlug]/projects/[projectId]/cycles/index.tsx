import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";
import useSWR from "swr";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Tab } from "@headlessui/react";

// lib
import { requiredAuth } from "lib/auth";
import { CyclesIcon } from "components/icons";
// services
import cycleService from "services/cycles.service";
import projectService from "services/project.service";
import workspaceService from "services/workspace.service";
// layouts
import AppLayout from "layouts/app-layout";
// components
import CreateUpdateCycleModal from "components/project/cycles/create-update-cycle-modal";
import CycleStatsView from "components/project/cycles/stats-view";
// ui
import { HeaderButton, EmptySpace, EmptySpaceItem, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
// types
import { ICycle, SelectCycleType } from "types";
import type { NextPage, NextPageContext } from "next";
// fetching keys
import { CYCLE_LIST, PROJECT_DETAILS, WORKSPACE_DETAILS } from "constants/fetch-keys";

const ProjectCycles: NextPage = () => {
  const [selectedCycle, setSelectedCycle] = useState<SelectCycleType>();
  const [createUpdateCycleModal, setCreateUpdateCycleModal] = useState(false);

  const {
    query: { workspaceSlug, projectId },
  } = useRouter();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const { data: activeProject } = useSWR(
    activeWorkspace && projectId ? PROJECT_DETAILS(projectId as string) : null,
    activeWorkspace && projectId
      ? () => projectService.getProject(activeWorkspace.slug, projectId as string)
      : null
  );

  const { data: cycles } = useSWR<ICycle[]>(
    activeWorkspace && projectId ? CYCLE_LIST(projectId as string) : null,
    activeWorkspace && projectId
      ? () => cycleService.getCycles(activeWorkspace.slug, projectId as string)
      : null
  );

  const getCycleStatus = (startDate: string, endDate: string) => {
    const today = new Date();

    if (today < new Date(startDate)) return "upcoming";
    else if (today > new Date(endDate)) return "completed";
    else return "current";
  };

  const currentCycles = cycles?.filter(
    (c) => getCycleStatus(c.start_date ?? "", c.end_date ?? "") === "current"
  );

  const upcomingCycles = cycles?.filter(
    (c) => getCycleStatus(c.start_date ?? "", c.end_date ?? "") === "upcoming"
  );

  const completedCycles = cycles?.filter(
    (c) => getCycleStatus(c.start_date ?? "", c.end_date ?? "") === "completed"
  );

  useEffect(() => {
    if (createUpdateCycleModal) return;
    const timer = setTimeout(() => {
      setSelectedCycle(undefined);
      clearTimeout(timer);
    }, 500);
  }, [createUpdateCycleModal]);

  return (
    <AppLayout
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
        <HeaderButton
          Icon={PlusIcon}
          label="Add Cycle"
          onClick={() => {
            const e = new KeyboardEvent("keydown", {
              ctrlKey: true,
              key: "q",
            });
            document.dispatchEvent(e);
          }}
        />
      }
    >
      <CreateUpdateCycleModal
        isOpen={createUpdateCycleModal}
        setIsOpen={setCreateUpdateCycleModal}
        projectId={projectId as string}
        data={selectedCycle}
      />
      {cycles ? (
        cycles.length > 0 ? (
          <div className="space-y-8">
            <h3 className="text-xl font-medium leading-6 text-gray-900">Current Cycle</h3>
            <div className="space-y-5">
              <CycleStatsView
                cycles={currentCycles ?? []}
                setCreateUpdateCycleModal={setCreateUpdateCycleModal}
                setSelectedCycle={setSelectedCycle}
                type="current"
              />
            </div>
            <div className="space-y-5">
              <Tab.Group>
                <Tab.List
                  as="div"
                  className="grid grid-cols-2 items-center gap-2 rounded-lg bg-gray-100 p-2 text-sm"
                >
                  <Tab
                    className={({ selected }) =>
                      `rounded-lg px-6 py-2 ${selected ? "bg-gray-300" : "hover:bg-gray-200"}`
                    }
                  >
                    Upcoming
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `rounded-lg px-6 py-2 ${selected ? "bg-gray-300" : "hover:bg-gray-200"}`
                    }
                  >
                    Completed
                  </Tab>
                </Tab.List>
                <Tab.Panels>
                  <Tab.Panel as="div" className="mt-8 space-y-5">
                    <CycleStatsView
                      cycles={upcomingCycles ?? []}
                      setCreateUpdateCycleModal={setCreateUpdateCycleModal}
                      setSelectedCycle={setSelectedCycle}
                      type="upcoming"
                    />
                  </Tab.Panel>
                  <Tab.Panel as="div" className="mt-8 space-y-5">
                    <CycleStatsView
                      cycles={completedCycles ?? []}
                      setCreateUpdateCycleModal={setCreateUpdateCycleModal}
                      setSelectedCycle={setSelectedCycle}
                      type="completed"
                    />
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center px-4">
            <EmptySpace
              title="You don't have any cycle yet."
              description="A cycle is a fixed time period where a team commits to a set number of issues from their backlog. Cycles are usually one, two, or four weeks long."
              Icon={CyclesIcon}
            >
              <EmptySpaceItem
                title="Create a new cycle"
                description={
                  <span>
                    Use <pre className="inline rounded bg-gray-100 px-2 py-1">Ctrl/Command + Q</pre>{" "}
                    shortcut to create a new cycle
                  </span>
                }
                Icon={PlusIcon}
                action={() => {
                  const e = new KeyboardEvent("keydown", {
                    ctrlKey: true,
                    key: "q",
                  });
                  document.dispatchEvent(e);
                }}
              />
            </EmptySpace>
          </div>
        )
      ) : (
        <Loader className="space-y-5">
          <Loader.Item height="150px" />
          <Loader.Item height="150px" />
        </Loader>
      )}
    </AppLayout>
  );
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.req?.url;

  if (!user) {
    return {
      redirect: {
        destination: `/signin?next=${redirectAfterSignIn}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
};

export default ProjectCycles;
