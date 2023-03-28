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
import viewsService from "services/views.service";
// hooks
import useToast from "hooks/use-toast";
import useIssuesView from "hooks/use-issues-view";
// components
import { AllLists, AllBoards } from "components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { CreateUpdateViewModal } from "components/views";
// ui
import { Avatar, EmptySpace, EmptySpaceItem, PrimaryButton, Spinner } from "components/ui";
// icons
import {
  ListBulletIcon,
  PlusIcon,
  RectangleStackIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ExclamationIcon, getStateGroupIcon } from "components/icons";
// helpers
import { getStatesList } from "helpers/state.helper";
// types
import {
  CycleIssueResponse,
  IIssue,
  IIssueFilterOptions,
  ModuleIssueResponse,
  UserAuth,
} from "types";
// fetch-keys
import {
  CYCLE_ISSUES,
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  PROJECT_MEMBERS,
  STATE_LIST,
  VIEW_DETAILS,
} from "constants/fetch-keys";
import { getPriorityIcon } from "components/icons/priority-icon";

type Props = {
  type?: "issue" | "cycle" | "module";
  openIssuesListModal?: () => void;
  isCompleted?: boolean;
  userAuth: UserAuth;
};

export const IssuesView: React.FC<Props> = ({
  type = "issue",
  openIssuesListModal,
  isCompleted = false,
  userAuth,
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

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

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
          .then(() => {
            if (cycleId) mutate(CYCLE_ISSUES(cycleId as string));
            if (moduleId) mutate(MODULE_ISSUES(moduleId as string));
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

  const nullFilters = Object.keys(filters).filter(
    (key) => filters[key as keyof IIssueFilterOptions] === null
  );

  return (
    <>
      <CreateUpdateViewModal
        isOpen={createViewModal !== null}
        handleClose={() => setCreateViewModal(null)}
        preLoadedData={createViewModal}
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
      <div className="mb-5 -mt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {Object.keys(filters).map((key) => {
              if (filters[key as keyof typeof filters] !== null)
                return (
                  <div key={key} className="flex items-center gap-x-2 rounded bg-white px-2 py-1">
                    <span className="font-medium capitalize text-gray-500">{key}:</span>
                    {filters[key as keyof IIssueFilterOptions] === null ||
                    (filters[key as keyof IIssueFilterOptions]?.length ?? 0) <= 0 ? (
                      <span>None</span>
                    ) : Array.isArray(filters[key as keyof IIssueFilterOptions]) ? (
                      <div className="space-x-2">
                        {key === "state" ? (
                          <div className="flex items-center gap-x-1">
                            {filters.state?.map((stateId: any) => {
                              const state = states?.find((s) => s.id === stateId);

                              return (
                                <p
                                  key={state?.id}
                                  className="inline-flex items-center gap-x-1 rounded-full px-2 py-0.5 font-medium text-white"
                                  style={{
                                    color: state?.color,
                                    backgroundColor: `${state?.color}20`,
                                  }}
                                >
                                  <span>
                                    {getStateGroupIcon(
                                      state?.group ?? "backlog",
                                      "12",
                                      "12",
                                      state?.color
                                    )}
                                  </span>
                                  <span>{state?.name ?? ""}</span>
                                  <span
                                    className="cursor-pointer"
                                    onClick={() =>
                                      setFilters(
                                        {
                                          state: filters.state?.filter((s: any) => s !== stateId),
                                        },
                                        !Boolean(viewId)
                                      )
                                    }
                                  >
                                    <XMarkIcon className="h-3 w-3" />
                                  </span>
                                </p>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() =>
                                setFilters({
                                  state: null,
                                })
                              }
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : key === "priority" ? (
                          <div className="flex items-center gap-x-1">
                            {filters.priority?.map((priority: any) => (
                              <p
                                key={priority}
                                className={`inline-flex items-center gap-x-1 rounded-full px-2 py-0.5 font-medium capitalize text-white ${
                                  priority === "urgent"
                                    ? "bg-red-100 text-red-600 hover:bg-red-100"
                                    : priority === "high"
                                    ? "bg-orange-100 text-orange-500 hover:bg-orange-100"
                                    : priority === "medium"
                                    ? "bg-yellow-100 text-yellow-500 hover:bg-yellow-100"
                                    : priority === "low"
                                    ? "bg-green-100 text-green-500 hover:bg-green-100"
                                    : "bg-gray-100"
                                }`}
                              >
                                <span>{getPriorityIcon(priority)}</span>
                                <span>{priority}</span>
                                <span
                                  className="cursor-pointer"
                                  onClick={() =>
                                    setFilters(
                                      {
                                        priority: filters.priority?.filter(
                                          (p: any) => p !== priority
                                        ),
                                      },
                                      !Boolean(viewId)
                                    )
                                  }
                                >
                                  <XMarkIcon className="h-3 w-3" />
                                </span>
                              </p>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                setFilters({
                                  priority: null,
                                })
                              }
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : key === "assignees" ? (
                          <div className="flex items-center gap-x-1">
                            {filters.assignees?.map((memberId: string) => {
                              const member = members?.find((m) => m.member.id === memberId)?.member;

                              return (
                                <p
                                  key={memberId}
                                  className="inline-flex items-center gap-x-1 rounded-full border px-2 py-0.5 font-medium capitalize"
                                >
                                  <Avatar user={member} />
                                  <span>{member?.first_name}</span>
                                  <span
                                    className="cursor-pointer"
                                    onClick={() =>
                                      setFilters(
                                        {
                                          assignees: filters.assignees?.filter(
                                            (p: any) => p !== memberId
                                          ),
                                        },
                                        !Boolean(viewId)
                                      )
                                    }
                                  >
                                    <XMarkIcon className="h-3 w-3" />
                                  </span>
                                </p>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() =>
                                setFilters({
                                  assignees: null,
                                })
                              }
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (key as keyof IIssueFilterOptions) === "created_by" ? (
                          <div className="flex items-center gap-x-1">
                            {filters.created_by?.map((memberId: string) => {
                              const member = members?.find((m) => m.member.id === memberId)?.member;

                              return (
                                <p
                                  key={memberId}
                                  className="inline-flex items-center gap-x-1 rounded-full border px-2 py-0.5 font-medium capitalize"
                                >
                                  <Avatar user={member} />
                                  <span>{member?.first_name}</span>
                                  <span
                                    className="cursor-pointer"
                                    onClick={() =>
                                      setFilters(
                                        {
                                          assignees: filters.created_by?.filter(
                                            (p: any) => p !== memberId
                                          ),
                                        },
                                        !Boolean(viewId)
                                      )
                                    }
                                  >
                                    <XMarkIcon className="h-3 w-3" />
                                  </span>
                                </p>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() =>
                                setFilters({
                                  created_by: null,
                                })
                              }
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          (filters[key as keyof IIssueFilterOptions] as any)?.join(", ")
                        )}
                      </div>
                    ) : (
                      <span className="capitalize">{filters[key as keyof typeof filters]}</span>
                    )}
                  </div>
                );
            })}
          </div>

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
        {Object.keys(filters).length > 0 && nullFilters.length !== Object.keys(filters).length && (
          <button
            onClick={() =>
              setFilters({
                state: null,
                priority: null,
                assignees: null,
                labels: null,
              })
            }
            className="mt-2 flex items-center gap-x-1 text-xs"
          >
            <span>Clear all filters</span>
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
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
              {isCompleted && (
                <div className="flex items-center gap-2 text-sm mb-4 text-gray-500">
                  <ExclamationIcon height={14} width={14} />
                  <span>Completed cycles are not editable.</span>
                </div>
              )}
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
                  userAuth={userAuth}
                />
              ) : (
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
                  userAuth={userAuth}
                />
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
