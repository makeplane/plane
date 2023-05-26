import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";
// hooks
// services
import cycleService from "services/cycles.service";
import projectService from "services/project.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// components
import { CreateUpdateCycleModal, CyclesView } from "components/cycles";
// ui
import { PrimaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { SelectCycleType } from "types";
import type { NextPage } from "next";
// fetch-keys
import {
  CYCLE_DRAFT_LIST,
  PROJECT_DETAILS,
  CYCLE_UPCOMING_LIST,
  CYCLE_CURRENT_LIST,
  CYCLE_LIST,
} from "constants/fetch-keys";

const ProjectCycles: NextPage = () => {
  const [selectedCycle, setSelectedCycle] = useState<SelectCycleType>();
  const [createUpdateCycleModal, setCreateUpdateCycleModal] = useState(false);

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
      ? () =>
          cycleService.getCyclesWithParams(workspaceSlug as string, projectId as string, {
            cycle_view: "draft",
          })
      : null
  );

  const { data: currentCycle } = useSWR(
    workspaceSlug && projectId ? CYCLE_CURRENT_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () =>
          cycleService.getCyclesWithParams(workspaceSlug as string, projectId as string, {
            cycle_view: "current",
          })
      : null
  );

  const { data: upcomingCycles } = useSWR(
    workspaceSlug && projectId ? CYCLE_UPCOMING_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () =>
          cycleService.getCyclesWithParams(workspaceSlug as string, projectId as string, {
            cycle_view: "upcoming",
          })
      : null
  );

  const { data: cyclesCompleteList } = useSWR(
    workspaceSlug && projectId ? CYCLE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () =>
          cycleService.getCyclesWithParams(workspaceSlug as string, projectId as string, {
            cycle_view: "all",
          })
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
      <div className="space-y-5 p-8 h-full flex flex-col overflow-hidden">
        <CyclesView
          setSelectedCycle={setSelectedCycle}
          setCreateUpdateCycleModal={setCreateUpdateCycleModal}
          cyclesCompleteList={cyclesCompleteList}
          currentCycle={currentCycle}
          upcomingCycles={upcomingCycles}
          draftCycles={draftCycles}
        />
      </div>
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectCycles;
