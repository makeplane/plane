import { useCallback, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-beautiful-dnd
import { DragDropContext, DropResult } from "react-beautiful-dnd";
// services
import issuesService from "services/issues.service";
import stateService from "services/state.service";
import modulesService from "services/modules.service";
import trackEventServices from "services/track-event.service";
// contexts
import { useProjectMyMembership } from "contexts/project-member.context";
// hooks
import useToast from "hooks/use-toast";
import useIssuesView from "hooks/use-issues-view";
// components
import { AllLists, AllBoards, FilterList } from "components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { CreateUpdateViewModal } from "components/views";
import { TransferIssues, TransferIssuesModal } from "components/cycles";
// ui
import { EmptySpace, EmptySpaceItem, PrimaryButton, Spinner } from "components/ui";
import { CalendarView } from "./calendar-view";
// icons
import {
  ListBulletIcon,
  PlusIcon,
  RectangleStackIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { ExclamationIcon, TransferIcon } from "components/icons";
// helpers
import { getStatesList } from "helpers/state.helper";
// types
import { IIssue, IIssueFilterOptions, UserAuth } from "types";
// fetch-keys
import {
  CYCLE_DETAILS,
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_DETAILS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  STATE_LIST,
} from "constants/fetch-keys";

type Props = {
  type?: "issue" | "cycle" | "module";
  openIssuesListModal?: () => void;
  isCompleted?: boolean;
};

export const IssuesView: React.FC<Props> = ({
  type = "issue",
  openIssuesListModal,
  isCompleted = false,
}) => {
  // create issue modal
  const [createIssueModal, setCreateIssueModal] = useState(false);
  const [createViewModal, setCreateViewModal] = useState<any>(null);
  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  // update issue modal
  const [editIssueModal, setEditIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<
    (IIssue & { actionType: "edit" | "delete" }) | undefined
  >(undefined);

  // delete issue modal
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<IIssue | null>(null);

  // trash box
  const [trashBox, setTrashBox] = useState(false);

  // transfer issue
  const [transferIssuesModal, setTransferIssuesModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const { memberRole } = useProjectMyMembership();

  const { setToastAlert } = useToast();

  const {
    groupedByIssues,
    issueView,
    groupByProperty: selectedGroup,
    orderBy,
    filters,
    isNotEmpty,
    setFilters,
    params,
  } = useIssuesView();

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const states = getStatesList(stateGroups ?? {});

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

      if (!result.destination || !workspaceSlug || !projectId || !groupedByIssues) return;

      const { source, destination } = result;

      const draggedItem = groupedByIssues[source.droppableId][source.index];

      if (destination.droppableId === "trashBox") {
        handleDeleteIssue(draggedItem);
      } else {
        if (orderBy === "sort_order") {
          let newSortOrder = draggedItem.sort_order;

          const destinationGroupArray = groupedByIssues[destination.droppableId];

          if (destinationGroupArray.length !== 0) {
            // check if dropping in the same group
            if (source.droppableId === destination.droppableId) {
              // check if dropping at beginning
              if (destination.index === 0)
                newSortOrder = destinationGroupArray[0].sort_order - 10000;
              // check if dropping at last
              else if (destination.index === destinationGroupArray.length - 1)
                newSortOrder =
                  destinationGroupArray[destinationGroupArray.length - 1].sort_order + 10000;
              else {
                if (destination.index > source.index)
                  newSortOrder =
                    (destinationGroupArray[source.index + 1].sort_order +
                      destinationGroupArray[source.index + 2].sort_order) /
                    2;
                else if (destination.index < source.index)
                  newSortOrder =
                    (destinationGroupArray[source.index - 1].sort_order +
                      destinationGroupArray[source.index - 2].sort_order) /
                    2;
              }
            } else {
              // check if dropping at beginning
              if (destination.index === 0)
                newSortOrder = destinationGroupArray[0].sort_order - 10000;
              // check if dropping at last
              else if (destination.index === destinationGroupArray.length)
                newSortOrder =
                  destinationGroupArray[destinationGroupArray.length - 1].sort_order + 10000;
              else
                newSortOrder =
                  (destinationGroupArray[destination.index - 1].sort_order +
                    destinationGroupArray[destination.index].sort_order) /
                  2;
            }
          }

          draggedItem.sort_order = newSortOrder;
        }

        const destinationGroup = destination.droppableId; // destination group id

        if (orderBy === "sort_order" || source.droppableId !== destination.droppableId) {
          // different group/column;

          // source.droppableId !== destination.droppableId -> even if order by is not sort_order,
          // if the issue is moved to a different group, then we will change the group of the
          // dragged item(or issue)

          if (selectedGroup === "priority") draggedItem.priority = destinationGroup;
          else if (selectedGroup === "state") draggedItem.state = destinationGroup;
        }

        const sourceGroup = source.droppableId; // source group id

        // TODO: move this mutation logic to a separate function
        if (cycleId)
          mutate<{
            [key: string]: IIssue[];
          }>(
            CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params),
            (prevData) => {
              if (!prevData) return prevData;

              const sourceGroupArray = prevData[sourceGroup];
              const destinationGroupArray = groupedByIssues[destinationGroup];

              sourceGroupArray.splice(source.index, 1);
              destinationGroupArray.splice(destination.index, 0, draggedItem);

              return {
                ...prevData,
                [sourceGroup]: sourceGroupArray,
                [destinationGroup]: destinationGroupArray,
              };
            },
            false
          );
        else if (moduleId)
          mutate<{
            [key: string]: IIssue[];
          }>(
            MODULE_ISSUES_WITH_PARAMS(moduleId as string, params),
            (prevData) => {
              if (!prevData) return prevData;

              const sourceGroupArray = prevData[sourceGroup];
              const destinationGroupArray = groupedByIssues[destinationGroup];

              sourceGroupArray.splice(source.index, 1);
              destinationGroupArray.splice(destination.index, 0, draggedItem);

              return {
                ...prevData,
                [sourceGroup]: sourceGroupArray,
                [destinationGroup]: destinationGroupArray,
              };
            },
            false
          );
        else
          mutate<{ [key: string]: IIssue[] }>(
            PROJECT_ISSUES_LIST_WITH_PARAMS(projectId as string, params),
            (prevData) => {
              if (!prevData) return prevData;

              const sourceGroupArray = prevData[sourceGroup];
              const destinationGroupArray = groupedByIssues[destinationGroup];

              sourceGroupArray.splice(source.index, 1);
              destinationGroupArray.splice(destination.index, 0, draggedItem);

              return {
                ...prevData,
                [sourceGroup]: sourceGroupArray,
                [destinationGroup]: destinationGroupArray,
              };
            },
            false
          );

        // patch request
        issuesService
          .patchIssue(workspaceSlug as string, projectId as string, draggedItem.id, {
            priority: draggedItem.priority,
            state: draggedItem.state,
            sort_order: draggedItem.sort_order,
          })
          .then((response) => {
            const sourceStateBeforeDrag = states.find((state) => state.name === source.droppableId);

            if (
              sourceStateBeforeDrag?.group !== "completed" &&
              response?.state_detail?.group === "completed"
            )
              trackEventServices.trackIssueMarkedAsDoneEvent({
                workspaceSlug,
                workspaceId: draggedItem.workspace_detail.id,
                projectName: draggedItem.project_detail.name,
                projectIdentifier: draggedItem.project_detail.identifier,
                projectId,
                issueId: draggedItem.id,
              });

            if (cycleId) {
              mutate(CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params));
              mutate(CYCLE_DETAILS(cycleId as string));
            }
            if (moduleId) {
              mutate(MODULE_ISSUES_WITH_PARAMS(moduleId as string, params));
              mutate(MODULE_DETAILS(moduleId as string));
            }
            mutate(PROJECT_ISSUES_LIST_WITH_PARAMS(projectId as string, params));
          });
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
      handleDeleteIssue,
      params,
      states,
    ]
  );

  const addIssueToState = useCallback(
    (groupTitle: string) => {
      setCreateIssueModal(true);
      if (selectedGroup)
        setPreloadedData({
          [selectedGroup]: groupTitle,
          actionType: "createIssue",
        });
      else setPreloadedData({ actionType: "createIssue" });
    },
    [setCreateIssueModal, setPreloadedData, selectedGroup]
  );

  const makeIssueCopy = useCallback(
    (issue: IIssue) => {
      setCreateIssueModal(true);

      setPreloadedData({ ...issue, name: `${issue.name} (Copy)`, actionType: "createIssue" });
    },
    [setCreateIssueModal, setPreloadedData]
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
      if (!workspaceSlug || !projectId || !cycleId) return;

      mutate(CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params));

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
    [workspaceSlug, projectId, cycleId, params]
  );

  const removeIssueFromModule = useCallback(
    (bridgeId: string) => {
      if (!workspaceSlug || !projectId || !moduleId) return;

      mutate(MODULE_ISSUES_WITH_PARAMS(moduleId as string, params));

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
    [workspaceSlug, projectId, moduleId, params]
  );

  const handleTrashBox = useCallback(
    (isDragging: boolean) => {
      if (isDragging && !trashBox) setTrashBox(true);
    },
    [trashBox, setTrashBox]
  );

  const nullFilters = Object.keys(filters).filter(
    (key) => filters[key as keyof IIssueFilterOptions] === null
  );

  return (
    <>
      <CreateUpdateViewModal
        isOpen={createViewModal !== null}
        handleClose={() => setCreateViewModal(null)}
        data={createViewModal}
      />
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
      <TransferIssuesModal
        handleClose={() => setTransferIssuesModal(false)}
        isOpen={transferIssuesModal}
      />
      <div className="mb-5 -mt-4">
        <div className="flex items-center justify-between gap-2">
          <FilterList filters={filters} setFilters={setFilters} />
          {Object.keys(filters).length > 0 &&
            nullFilters.length !== Object.keys(filters).length && (
              <PrimaryButton
                onClick={() => {
                  if (viewId) {
                    setFilters({}, true);
                    setToastAlert({
                      title: "View updated",
                      message: "Your view has been updated",
                      type: "success",
                    });
                  } else
                    setCreateViewModal({
                      query: filters,
                    });
                }}
                className="flex items-center gap-2 text-sm"
              >
                {!viewId && <PlusIcon className="h-4 w-4" />}
                {viewId ? "Update" : "Save"} view
              </PrimaryButton>
            )}
        </div>
      </div>

      {Object.keys(filters).length > 0 && nullFilters.length !== Object.keys(filters).length && (
        <div className="mb-5 border-t" />
      )}

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <StrictModeDroppable droppableId="trashBox">
          {(provided, snapshot) => (
            <div
              className={`${
                trashBox ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
              } fixed top-9 right-9 z-20 flex h-28 w-96 flex-col items-center justify-center gap-2 rounded border-2 border-red-500 bg-red-100 p-3 text-xs font-medium italic text-red-500 ${
                snapshot.isDraggingOver ? "bg-red-500 text-white" : ""
              } duration-200`}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <TrashIcon className="h-4 w-4" />
              Drop issue here to delete
              {provided.placeholder}
            </div>
          )}
        </StrictModeDroppable>
        {groupedByIssues ? (
          isNotEmpty ? (
            <>
              {isCompleted && <TransferIssues handleClick={() => setTransferIssuesModal(true)} />}
              {issueView === "list" ? (
                <AllLists
                  type={type}
                  states={states}
                  addIssueToState={addIssueToState}
                  makeIssueCopy={makeIssueCopy}
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
                  isCompleted={isCompleted}
                  userAuth={memberRole}
                />
              ) : issueView === "kanban" ? (
                <AllBoards
                  type={type}
                  states={states}
                  addIssueToState={addIssueToState}
                  makeIssueCopy={makeIssueCopy}
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
                  isCompleted={isCompleted}
                  userAuth={memberRole}
                />
              ) : (
                <CalendarView />
              )}
            </>
          ) : (
            <div className="grid h-full w-full place-items-center px-4 sm:px-0">
              <EmptySpace
                title="You don't have any issue yet."
                description="Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done."
                Icon={RectangleStackIcon}
              >
                <EmptySpaceItem
                  title="Create a new issue"
                  description={
                    <span>
                      Use <pre className="inline rounded bg-gray-200 px-2 py-1">C</pre> shortcut to
                      create a new issue
                    </span>
                  }
                  Icon={PlusIcon}
                  action={() => {
                    const e = new KeyboardEvent("keydown", {
                      key: "c",
                    });
                    document.dispatchEvent(e);
                  }}
                />
                {openIssuesListModal && (
                  <EmptySpaceItem
                    title="Add an existing issue"
                    description="Open list"
                    Icon={ListBulletIcon}
                    action={openIssuesListModal}
                  />
                )}
              </EmptySpace>
            </div>
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Spinner />
          </div>
        )}
      </DragDropContext>
    </>
  );
};
