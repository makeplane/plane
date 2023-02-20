import { useCallback, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-beautiful-dnd
import { DragDropContext, DropResult } from "react-beautiful-dnd";
// services
import issuesService from "services/issues.service";
import stateService from "services/state.service";
import projectService from "services/project.service";
import modulesService from "services/modules.service";
// hooks
import useIssueView from "hooks/use-issue-view";
// components
import { AllLists, AllBoards } from "components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
// icons
import { TrashIcon } from "@heroicons/react/24/outline";
// helpers
import { getStatesList } from "helpers/state.helper";
// types
import { CycleIssueResponse, IIssue, ModuleIssueResponse, UserAuth } from "types";
// fetch-keys
import {
  CYCLE_ISSUES,
  MODULE_ISSUES,
  PROJECT_ISSUES_LIST,
  PROJECT_MEMBERS,
  STATE_LIST,
} from "constants/fetch-keys";

type Props = {
  type?: "issue" | "cycle" | "module";
  issues: IIssue[];
  openIssuesListModal?: () => void;
  userAuth: UserAuth;
};

export const IssuesView: React.FC<Props> = ({
  type = "issue",
  issues,
  openIssuesListModal,
  userAuth,
}) => {
  // create issue modal
  const [createIssueModal, setCreateIssueModal] = useState(false);
  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  // updates issue modal
  const [editIssueModal, setEditIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<
    (IIssue & { actionType: "edit" | "delete" }) | undefined
  >(undefined);

  // delete issue modal
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<IIssue | null>(null);

  // trash box
  const [trashBox, setTrashBox] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const {
    issueView,
    groupedByIssues,
    groupByProperty: selectedGroup,
    orderBy,
  } = useIssueView(issues);

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const states = getStatesList(stateGroups ?? {});

  const { data: members } = useSWR(
    projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const handleDeleteIssue = useCallback(
    (issue: IIssue) => {
      setDeleteIssueModal(true);
      setIssueToDelete(issue);
    },
    [setDeleteIssueModal, setIssueToDelete]
  );

  const handleOnDragEnd = useCallback(
    (result: DropResult) => {
      setTrashBox(false);

      if (!result.destination || !workspaceSlug || !projectId) return;

      const { source, destination } = result;

      const draggedItem = groupedByIssues[source.droppableId][source.index];
      let newSortOrder = draggedItem.sort_order;

      if (destination.droppableId === "trashBox") {
        handleDeleteIssue(draggedItem);
      } else {
        if (orderBy === "sort_order") {
          const destinationGroupArray = groupedByIssues[destination.droppableId];

          if (destination.index === 0) newSortOrder = destinationGroupArray[0].sort_order - 10000;
          else if (destination.index === destinationGroupArray.length)
            newSortOrder =
              destinationGroupArray[destinationGroupArray.length - 1].sort_order + 10000;
          else
            newSortOrder =
              (destinationGroupArray[destination.index - 1].sort_order +
                destinationGroupArray[destination.index].sort_order) /
              2;
        }

        if (source.droppableId !== destination.droppableId) {
          const sourceGroup = source.droppableId; // source group id
          const destinationGroup = destination.droppableId; // destination group id

          if (!sourceGroup || !destinationGroup) return;

          if (selectedGroup === "priority") {
            // update the removed item for mutation
            draggedItem.priority = destinationGroup;

            if (cycleId)
              mutate<CycleIssueResponse[]>(
                CYCLE_ISSUES(cycleId as string),
                (prevData) => {
                  if (!prevData) return prevData;
                  const updatedIssues = prevData.map((issue) => {
                    if (issue.issue_detail.id === draggedItem.id) {
                      return {
                        ...issue,
                        issue_detail: {
                          ...draggedItem,
                          priority: destinationGroup,
                          sort_order: newSortOrder,
                        },
                      };
                    }
                    return issue;
                  });
                  return [...updatedIssues];
                },
                false
              );

            if (moduleId)
              mutate<ModuleIssueResponse[]>(
                MODULE_ISSUES(moduleId as string),
                (prevData) => {
                  if (!prevData) return prevData;
                  const updatedIssues = prevData.map((issue) => {
                    if (issue.issue_detail.id === draggedItem.id) {
                      return {
                        ...issue,
                        issue_detail: {
                          ...draggedItem,
                          priority: destinationGroup,
                          sort_order: newSortOrder,
                        },
                      };
                    }
                    return issue;
                  });
                  return [...updatedIssues];
                },
                false
              );

            mutate<IIssue[]>(
              PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string),
              (prevData) => {
                if (!prevData) return prevData;

                const updatedIssues = prevData.map((issue) => {
                  if (issue.id === draggedItem.id)
                    return {
                      ...draggedItem,
                      priority: destinationGroup,
                      sort_order: newSortOrder,
                    };

                  return issue;
                });

                return updatedIssues;
              },
              false
            );

            // patch request
            issuesService
              .patchIssue(workspaceSlug as string, projectId as string, draggedItem.id, {
                priority: destinationGroup,
                sort_order: newSortOrder,
              })
              .then((res) => {
                if (cycleId) mutate(CYCLE_ISSUES(cycleId as string));
                if (moduleId) mutate(MODULE_ISSUES(moduleId as string));

                mutate(PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string));
              });
          } else if (selectedGroup === "state_detail.name") {
            const destinationState = states?.find((s) => s.name === destinationGroup);
            const destinationStateId = destinationState?.id;

            // update the removed item for mutation
            if (!destinationStateId || !destinationState) return;
            draggedItem.state = destinationStateId;
            draggedItem.state_detail = destinationState;

            if (cycleId)
              mutate<CycleIssueResponse[]>(
                CYCLE_ISSUES(cycleId as string),
                (prevData) => {
                  if (!prevData) return prevData;
                  const updatedIssues = prevData.map((issue) => {
                    if (issue.issue_detail.id === draggedItem.id) {
                      return {
                        ...issue,
                        issue_detail: {
                          ...draggedItem,
                          state_detail: destinationState,
                          state: destinationStateId,
                          sort_order: newSortOrder,
                        },
                      };
                    }
                    return issue;
                  });
                  return [...updatedIssues];
                },
                false
              );

            if (moduleId)
              mutate<ModuleIssueResponse[]>(
                MODULE_ISSUES(moduleId as string),
                (prevData) => {
                  if (!prevData) return prevData;
                  const updatedIssues = prevData.map((issue) => {
                    if (issue.issue_detail.id === draggedItem.id) {
                      return {
                        ...issue,
                        issue_detail: {
                          ...draggedItem,
                          state_detail: destinationState,
                          state: destinationStateId,
                          sort_order: newSortOrder,
                        },
                      };
                    }
                    return issue;
                  });
                  return [...updatedIssues];
                },
                false
              );

            mutate<IIssue[]>(
              PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string),
              (prevData) => {
                if (!prevData) return prevData;

                const updatedIssues = prevData.map((issue) => {
                  if (issue.id === draggedItem.id)
                    return {
                      ...draggedItem,
                      state_detail: destinationState,
                      state: destinationStateId,
                      sort_order: newSortOrder,
                    };

                  return issue;
                });

                return updatedIssues;
              },
              false
            );

            // patch request
            issuesService
              .patchIssue(workspaceSlug as string, projectId as string, draggedItem.id, {
                state: destinationStateId,
                sort_order: newSortOrder,
              })
              .then((res) => {
                if (cycleId) mutate(CYCLE_ISSUES(cycleId as string));
                if (moduleId) mutate(MODULE_ISSUES(moduleId as string));

                mutate(PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string));
              });
          }
        }
      }
    },
    [
      workspaceSlug,
      cycleId,
      moduleId,
      groupedByIssues,
      projectId,
      selectedGroup,
      orderBy,
      states,
      handleDeleteIssue,
    ]
  );

  const addIssueToState = useCallback(
    (groupTitle: string, stateId: string | null) => {
      setCreateIssueModal(true);
      if (selectedGroup)
        setPreloadedData({
          state: stateId ?? undefined,
          [selectedGroup]: groupTitle,
          actionType: "createIssue",
        });
      else setPreloadedData({ actionType: "createIssue" });
    },
    [setCreateIssueModal, setPreloadedData, selectedGroup]
  );

  const handleEditIssue = useCallback(
    (issue: IIssue) => {
      setEditIssueModal(true);
      setIssueToEdit({
        ...issue,
        actionType: "edit",
        cycle: issue.issue_cycle ? issue.issue_cycle.cycle : null,
        module: issue.issue_module ? issue.issue_module.module : null,
      });
    },
    [setEditIssueModal, setIssueToEdit]
  );

  const removeIssueFromCycle = useCallback(
    (bridgeId: string) => {
      if (!workspaceSlug || !projectId) return;

      mutate<CycleIssueResponse[]>(
        CYCLE_ISSUES(cycleId as string),
        (prevData) => prevData?.filter((p) => p.id !== bridgeId),
        false
      );

      issuesService
        .removeIssueFromCycle(
          workspaceSlug as string,
          projectId as string,
          cycleId as string,
          bridgeId
        )
        .then((res) => {
          console.log(res);
        })
        .catch((e) => {
          console.log(e);
        });
    },
    [workspaceSlug, projectId, cycleId]
  );

  const removeIssueFromModule = useCallback(
    (bridgeId: string) => {
      if (!workspaceSlug || !projectId) return;

      mutate<ModuleIssueResponse[]>(
        MODULE_ISSUES(moduleId as string),
        (prevData) => prevData?.filter((p) => p.id !== bridgeId),
        false
      );

      modulesService
        .removeIssueFromModule(
          workspaceSlug as string,
          projectId as string,
          moduleId as string,
          bridgeId
        )
        .then((res) => {
          console.log(res);
        })
        .catch((e) => {
          console.log(e);
        });
    },
    [workspaceSlug, projectId, moduleId]
  );

  const handleTrashBox = useCallback(
    (isDragging: boolean) => {
      if (isDragging && !trashBox) setTrashBox(true);
    },
    [trashBox, setTrashBox]
  );

  return (
    <>
      <CreateUpdateIssueModal
        isOpen={createIssueModal && preloadedData?.actionType === "createIssue"}
        handleClose={() => setCreateIssueModal(false)}
        prePopulateData={{
          ...preloadedData,
        }}
      />
      <CreateUpdateIssueModal
        isOpen={editIssueModal && issueToEdit?.actionType !== "delete"}
        prePopulateData={{ ...issueToEdit }}
        handleClose={() => setEditIssueModal(false)}
        data={issueToEdit}
      />
      <DeleteIssueModal
        handleClose={() => setDeleteIssueModal(false)}
        isOpen={deleteIssueModal}
        data={issueToDelete}
      />

      <div className="relative">
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <StrictModeDroppable droppableId="trashBox">
            {(provided, snapshot) => (
              <div
                className={`${
                  trashBox ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                } fixed z-20 top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-100 border-2 border-red-500 p-3 text-xs rounded ${
                  snapshot.isDraggingOver ? "bg-red-500 text-white" : ""
                } duration-200`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <TrashIcon className="h-3 w-3" />
                Drop issue here to delete
              </div>
            )}
          </StrictModeDroppable>
          {issueView === "list" ? (
            <AllLists
              type={type}
              issues={issues}
              states={states}
              members={members}
              addIssueToState={addIssueToState}
              handleEditIssue={handleEditIssue}
              handleDeleteIssue={handleDeleteIssue}
              openIssuesListModal={type !== "issue" ? openIssuesListModal : null}
              removeIssue={
                type === "cycle"
                  ? removeIssueFromCycle
                  : type === "module"
                  ? removeIssueFromModule
                  : null
              }
              userAuth={userAuth}
            />
          ) : (
            <AllBoards
              type={type}
              issues={issues}
              states={states}
              members={members}
              addIssueToState={addIssueToState}
              handleEditIssue={handleEditIssue}
              openIssuesListModal={type !== "issue" ? openIssuesListModal : null}
              handleDeleteIssue={handleDeleteIssue}
              handleTrashBox={handleTrashBox}
              removeIssue={
                type === "cycle"
                  ? removeIssueFromCycle
                  : type === "module"
                  ? removeIssueFromModule
                  : null
              }
              userAuth={userAuth}
            />
          )}
        </DragDropContext>
      </div>
    </>
  );
};
