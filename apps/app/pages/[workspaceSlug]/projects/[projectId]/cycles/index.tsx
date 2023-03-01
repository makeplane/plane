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
import { CompletedCyclesListProps, CreateUpdateCycleModal, CyclesList } from "components/cycles";
// ui
import { HeaderButton, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
// types
import { SelectCycleType } from "types";
import type { NextPage, GetServerSidePropsContext } from "next";
// fetching keys
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

  const {
    query: { workspaceSlug, projectId },
  } = useRouter();

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
              className="flex justify-between items-center gap-2 rounded-lg bg-gray-100 p-2 text-sm"
            >
              <Tab
                className={({ selected }) =>
                  `w-1/3 rounded-lg px-6 py-2 ${selected ? "bg-gray-300" : "hover:bg-gray-200"}`
                }
              >
                Upcoming
              </Tab>
              <Tab
                className={({ selected }) =>
                  `w-1/3 rounded-lg px-6 py-2 ${selected ? "bg-gray-300" : "hover:bg-gray-200"}`
                }
              >
                Completed
              </Tab>
              <Tab
                className={({ selected }) =>
                  ` w-1/3 rounded-lg px-6 py-2 ${selected ? "bg-gray-300" : "hover:bg-gray-200"}`
                }
              >
                Draft
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
            <Tab.Panel as="div" className="mt-8 space-y-5">
              <CyclesList
                cycles={draftCycles?.draft_cycles ?? []}
                setCreateUpdateCycleModal={setCreateUpdateCycleModal}
                setSelectedCycle={setSelectedCycle}
                type="upcoming"
              />
            </Tab.Panel>
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
