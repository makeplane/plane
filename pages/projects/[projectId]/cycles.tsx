import React, { useEffect, useState } from "react";
// next
import { useRouter } from "next/router";
import type { NextPage } from "next";
// swr
import useSWR, { mutate } from "swr";
// services
import issuesServices from "lib/services/issues.services";
import sprintService from "lib/services/cycles.services";
// hooks
import useUser from "lib/hooks/useUser";
// fetching keys
import { CYCLE_ISSUES, CYCLE_LIST } from "constants/fetch-keys";
// layouts
import ProjectLayout from "layouts/ProjectLayout";
// components
import SprintView from "components/project/cycles/CycleView";
import ConfirmIssueDeletion from "components/project/issues/ConfirmIssueDeletion";
import ConfirmSprintDeletion from "components/project/cycles/ConfirmCycleDeletion";
import CreateUpdateIssuesModal from "components/project/issues/CreateUpdateIssueModal";
import CreateUpdateSprintsModal from "components/project/cycles/CreateUpdateCyclesModal";
// ui
import { Spinner } from "ui";
// icons
import { PlusIcon } from "@heroicons/react/20/solid";
// types
import { IIssue, ICycle, SelectSprintType, SelectIssue } from "types";
import { EmptySpace, EmptySpaceItem } from "ui/EmptySpace";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import HeaderButton from "ui/HeaderButton";
import { BreadcrumbItem, Breadcrumbs } from "ui/Breadcrumbs";

const ProjectSprints: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<SelectSprintType>();

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<SelectIssue>();
  const [deleteIssue, setDeleteIssue] = useState<string | undefined>();

  const { activeWorkspace, activeProject } = useUser();

  const router = useRouter();

  const { projectId } = router.query;

  const { data: sprints } = useSWR<ICycle[]>(
    projectId && activeWorkspace ? CYCLE_LIST(projectId as string) : null,
    activeWorkspace && projectId
      ? () => sprintService.getCycles(activeWorkspace.slug, projectId as string)
      : null
  );

  const openIssueModal = (
    sprintId: string,
    issue?: IIssue,
    actionType: "create" | "edit" | "delete" = "create"
  ) => {
    const sprint = sprints?.find((sprint) => sprint.id === sprintId);
    if (sprint) {
      setSelectedSprint({
        ...sprint,
        actionType: "create-issue",
      });
      if (issue) setSelectedIssues({ ...issue, actionType });
      setIsIssueModalOpen(true);
    }
  };

  const addIssueToSprint = (sprintId: string, issueId: string) => {
    if (!activeWorkspace || !projectId) return;

    issuesServices
      .addIssueToSprint(activeWorkspace.slug, projectId as string, sprintId, {
        issue: issueId,
      })
      .then((response) => {
        console.log(response);
        mutate(CYCLE_ISSUES(sprintId));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    if (isOpen) return;
    const timer = setTimeout(() => {
      setSelectedSprint(undefined);
      clearTimeout(timer);
    }, 500);
  }, [isOpen]);

  useEffect(() => {
    if (selectedIssues?.actionType === "delete") {
      setDeleteIssue(selectedIssues.id);
    }
  }, [selectedIssues]);

  return (
    <ProjectLayout
      meta={{
        title: "Plane - Cycles",
      }}
    >
      <CreateUpdateSprintsModal
        isOpen={
          isOpen &&
          selectedSprint?.actionType !== "delete" &&
          selectedSprint?.actionType !== "create-issue"
        }
        setIsOpen={setIsOpen}
        data={selectedSprint}
        projectId={projectId as string}
      />
      <ConfirmSprintDeletion
        isOpen={isOpen && !!selectedSprint && selectedSprint.actionType === "delete"}
        setIsOpen={setIsOpen}
        data={selectedSprint}
      />
      <ConfirmIssueDeletion
        handleClose={() => setDeleteIssue(undefined)}
        isOpen={!!deleteIssue}
        data={selectedIssues}
      />
      <CreateUpdateIssuesModal
        isOpen={
          isIssueModalOpen &&
          selectedSprint?.actionType === "create-issue" &&
          selectedIssues?.actionType !== "delete"
        }
        data={selectedIssues}
        prePopulateData={{ sprints: selectedSprint?.id }}
        setIsOpen={setIsOpen}
        projectId={projectId as string}
      />
      <div className="w-full h-full flex flex-col space-y-5">
        {sprints ? (
          sprints.length > 0 ? (
            <div className="flex flex-col items-center justify-center w-full h-full px-2">
              <div className="w-full h-full flex flex-col space-y-5">
                <Breadcrumbs>
                  <BreadcrumbItem title="Projects" link="/projects" />
                  <BreadcrumbItem title={`${activeProject?.name} Cycles`} />
                </Breadcrumbs>
                <div className="flex items-center justify-between cursor-pointer w-full">
                  <h2 className="text-2xl font-medium">Project Cycle</h2>
                  <HeaderButton Icon={PlusIcon} label="Add Cycle" action={() => setIsOpen(true)} />
                </div>
                <div className="w-full h-full pr-2 overflow-auto">
                  {sprints.map((sprint) => (
                    <SprintView
                      sprint={sprint}
                      selectSprint={setSelectedSprint}
                      projectId={projectId as string}
                      workspaceSlug={activeWorkspace?.slug as string}
                      openIssueModal={openIssueModal}
                      addIssueToSprint={addIssueToSprint}
                      key={sprint.id}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
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
                        Use{" "}
                        <pre className="inline bg-gray-100 px-2 py-1 rounded">Ctrl/Command + Q</pre>{" "}
                        shortcut to create a new cycle
                      </span>
                    }
                    Icon={PlusIcon}
                    action={() => setIsOpen(true)}
                  />
                </EmptySpace>
              </div>
            </>
          )
        ) : (
          <div className="w-full h-full flex justify-center items-center">
            <Spinner />
          </div>
        )}
      </div>
    </ProjectLayout>
  );
};

export default ProjectSprints;
