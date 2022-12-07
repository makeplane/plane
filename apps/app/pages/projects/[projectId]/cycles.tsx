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
import AppLayout from "layouts/AppLayout";
// components
import CycleView from "components/project/cycles/CycleView";
import ConfirmIssueDeletion from "components/project/issues/ConfirmIssueDeletion";
import ConfirmSprintDeletion from "components/project/cycles/ConfirmCycleDeletion";
import CreateUpdateIssuesModal from "components/project/issues/CreateUpdateIssueModal";
import CreateUpdateSprintsModal from "components/project/cycles/CreateUpdateCyclesModal";
// ui
import { BreadcrumbItem, Breadcrumbs, HeaderButton, Spinner, EmptySpace, EmptySpaceItem } from "ui";
// icons
import { PlusIcon } from "@heroicons/react/20/solid";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, ICycle, SelectSprintType, SelectIssue, CycleIssueResponse } from "types";
import { DragDropContext, DropResult } from "react-beautiful-dnd";

const ProjectSprints: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<SelectSprintType>();

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<SelectIssue>();
  const [deleteIssue, setDeleteIssue] = useState<string | undefined>();

  const { activeWorkspace, activeProject, issues } = useUser();

  const router = useRouter();

  const { projectId } = router.query;

  const { data: cycles } = useSWR<ICycle[]>(
    projectId && activeWorkspace ? CYCLE_LIST(projectId as string) : null,
    activeWorkspace && projectId
      ? () => sprintService.getCycles(activeWorkspace.slug, projectId as string)
      : null
  );

  const openIssueModal = (
    cycleId: string,
    issue?: IIssue,
    actionType: "create" | "edit" | "delete" = "create"
  ) => {
    const cycle = cycles?.find((cycle) => cycle.id === cycleId);
    if (cycle) {
      setSelectedSprint({
        ...cycle,
        actionType: "create-issue",
      });
      if (issue) setSelectedIssues({ ...issue, actionType });
      setIsIssueModalOpen(true);
    }
  };

  const addIssueToSprint = (cycleId: string, issueId: string) => {
    if (!activeWorkspace || !projectId) return;

    issuesServices
      .addIssueToSprint(activeWorkspace.slug, projectId as string, cycleId, {
        issue: issueId,
      })
      .then((response) => {
        console.log(response);
        mutate(CYCLE_ISSUES(cycleId));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) return;

    if (activeWorkspace && activeProject) {
      // remove issue from the source cycle
      mutate<CycleIssueResponse[]>(
        CYCLE_ISSUES(source.droppableId),
        (prevData) => prevData?.filter((p) => p.id !== result.draggableId.split(",")[0]),
        false
      );

      // add issue to the destination cycle
      mutate(CYCLE_ISSUES(destination.droppableId));

      // mutate<CycleIssueResponse[]>(
      //   CYCLE_ISSUES(destination.droppableId),
      //   (prevData) => {
      //     const issueDetails = issues?.results.find(
      //       (i) => i.id === result.draggableId.split(",")[1]
      //     );
      //     const targetResponse = prevData?.find((t) => t.cycle === destination.droppableId);
      //     console.log(issueDetails, targetResponse, prevData);
      //     if (targetResponse) {
      //       console.log("if");
      //       targetResponse.issue_details = issueDetails as IIssue;
      //       return prevData;
      //     } else {
      //       console.log("else");
      //       return [
      //         ...(prevData ?? []),
      //         {
      //           cycle: destination.droppableId,
      //           issue_details: issueDetails,
      //         } as CycleIssueResponse,
      //       ];
      //     }
      //   },
      //   false
      // );

      issuesServices
        .removeIssueFromCycle(
          activeWorkspace.slug,
          activeProject.id,
          source.droppableId,
          result.draggableId.split(",")[0]
        )
        .then((res) => {
          issuesServices
            .addIssueToSprint(activeWorkspace.slug, activeProject.id, destination.droppableId, {
              issue: result.draggableId.split(",")[1],
            })
            .then((res) => {
              console.log(res);
            })
            .catch((e) => {
              console.log(e);
            });
        })
        .catch((e) => {
          console.log(e);
        });
    }
    // console.log(result);
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
    <AppLayout
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
      {cycles ? (
        cycles.length > 0 ? (
          <div className="h-full w-full space-y-5">
            <Breadcrumbs>
              <BreadcrumbItem title="Projects" link="/projects" />
              <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Cycles`} />
            </Breadcrumbs>
            <div className="flex items-center justify-between cursor-pointer w-full">
              <h2 className="text-2xl font-medium">Project Cycle</h2>
              <HeaderButton Icon={PlusIcon} label="Add Cycle" onClick={() => setIsOpen(true)} />
            </div>
            <div className="space-y-5">
              <DragDropContext onDragEnd={handleDragEnd}>
                {cycles.map((cycle) => (
                  <CycleView
                    key={cycle.id}
                    cycle={cycle}
                    selectSprint={setSelectedSprint}
                    projectId={projectId as string}
                    workspaceSlug={activeWorkspace?.slug as string}
                    openIssueModal={openIssueModal}
                    addIssueToSprint={addIssueToSprint}
                  />
                ))}
              </DragDropContext>
            </div>
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
                action={() => setIsOpen(true)}
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

export default ProjectSprints;
