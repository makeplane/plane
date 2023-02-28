import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Tab } from "@headlessui/react";

// lib
import { requiredAuth } from "lib/auth";

// services
import cycleService from "services/cycles.service";
import projectService from "services/project.service";

// layouts
import AppLayout from "layouts/app-layout";
// components
import { CreateUpdateCycleModal, CyclesList } from "components/cycles";
// ui
import { HeaderButton, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
// types
import { SelectCycleType } from "types";
import type { NextPage, GetServerSidePropsContext } from "next";
// fetching keys
import {
  CYCLE_COMPLETE_LIST,
  CYCLE_CURRENT_AND_UPCOMING_LIST,
  PROJECT_DETAILS,
} from "constants/fetch-keys";

const CompletedCyclesList = dynamic(
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

  const {
    query: { workspaceSlug, projectId },
  } = useRouter();

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: currentAndUpcomingCycles } = useSWR(
    workspaceSlug && projectId ? CYCLE_CURRENT_AND_UPCOMING_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => cycleService.getCurrentAndUpcomingCycles(workspaceSlug as string, projectId as string)
      : null
  );

  const getCycleStatus = (startDate: string, endDate: string) => {
    const today = new Date();

    if (today < new Date(startDate)) return "upcoming";
    else if (today > new Date(endDate)) return "completed";
    else return "current";
  };

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
              key: "q",
            });
            document.dispatchEvent(e);
          }}
        />
      }
    >
      <CreateUpdateCycleModal
        isOpen={createUpdateCycleModal}
        handleClose={() => setCreateUpdateCycleModal(false)}
        data={selectedCycle}
      />
      <div className="space-y-8">
        <h3 className="text-xl font-medium leading-6 text-gray-900">Current Cycle</h3>
        <div className="space-y-5">
          <CyclesList
            cycles={currentAndUpcomingCycles?.current_cycle ?? []}
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
                <CyclesList
                  cycles={currentAndUpcomingCycles?.upcoming_cycle ?? []}
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
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </AppLayout>
  );
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.resolvedUrl;

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
