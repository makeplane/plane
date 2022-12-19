// react
import React, { useEffect, useState } from "react";
// next
import { useRouter } from "next/router";
import type { NextPage } from "next";
// swr
import useSWR from "swr";
// hoc
import withAuth from "lib/hoc/withAuthWrapper";
// services
import sprintService from "lib/services/cycles.service";
// hooks
import useUser from "lib/hooks/useUser";
// layouts
import AppLayout from "layouts/app-layout";
// components
import CreateUpdateCycleModal from "components/project/cycles/create-update-cycle-modal";
import CycleStatsView from "components/project/cycles/stats-view";
// ui
import { BreadcrumbItem, Breadcrumbs, HeaderButton, Spinner, EmptySpace, EmptySpaceItem } from "ui";
// icons
import { ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
// types
import { ICycle, SelectSprintType } from "types";
// fetching keys
import { CYCLE_LIST } from "constants/fetch-keys";

const ProjectSprints: NextPage = () => {
  const [selectedCycle, setSelectedCycle] = useState<SelectSprintType>();
  const [createUpdateCycleModal, setCreateUpdateCycleModal] = useState(false);

  const { activeWorkspace, activeProject } = useUser();

  const router = useRouter();

  const { projectId } = router.query;

  const { data: cycles } = useSWR<ICycle[]>(
    activeWorkspace && projectId ? CYCLE_LIST(projectId as string) : null,
    activeWorkspace && projectId
      ? () => sprintService.getCycles(activeWorkspace.slug, projectId as string)
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
          <BreadcrumbItem title="Projects" link="/projects" />
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
          <div className="space-y-5">
            <CycleStatsView
              cycles={cycles}
              setCreateUpdateCycleModal={setCreateUpdateCycleModal}
              setSelectedCycle={setSelectedCycle}
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center px-4">
            <EmptySpace
              title="You don't have any cycle yet."
              description="A cycle is a fixed time period where a team commits to a set number of issues from their backlog. Cycles are usually one, two, or four weeks long."
              Icon={ArrowPathIcon}
            >
              <EmptySpaceItem
                title="Create a new cycle"
                description={
                  <span>
                    Use <pre className="inline bg-gray-100 px-2 py-1 rounded">Ctrl/Command + Q</pre>{" "}
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
        <div className="w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      )}
    </AppLayout>
  );
};

export default withAuth(ProjectSprints);
