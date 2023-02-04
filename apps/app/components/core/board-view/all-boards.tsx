import { useCallback, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-beautiful-dnd
import { DragDropContext, Draggable, DropResult } from "react-beautiful-dnd";
// services
import issuesService from "services/issues.service";
import stateService from "services/state.service";
// hooks
import useIssueView from "hooks/use-issue-view";
// components
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { CommonSingleBoard } from "components/core/board-view/single-board";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
// types
import {
  CycleIssueResponse,
  IIssue,
  IssueResponse,
  IState,
  ModuleIssueResponse,
  UserAuth,
} from "types";
// fetch-keys
import { CYCLE_ISSUES, MODULE_ISSUES, PROJECT_ISSUES_LIST, STATE_LIST } from "constants/fetch-keys";

type Props = {
  type?: "issue" | "cycle" | "module";
  issues: IIssue[];
  openIssuesListModal?: () => void;
  handleDeleteIssue: React.Dispatch<React.SetStateAction<string | undefined>>;
  userAuth: UserAuth;
};

export const AllBoards: React.FC<Props> = ({
  type = "issue",
  issues,
  openIssuesListModal,
  handleDeleteIssue,
  userAuth,
}) => {
  const [createIssueModal, setCreateIssueModal] = useState(false);
  const [isIssueDeletionOpen, setIsIssueDeletionOpen] = useState(false);
  const [issueDeletionData, setIssueDeletionData] = useState<IIssue | undefined>();
  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { issueView, groupedByIssues, groupByProperty: selectedGroup } = useIssueView(issues);

  const { data: states, mutate: mutateState } = useSWR<IState[]>(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );

  const handleOnDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || !workspaceSlug || !projectId) return;

      const { source, destination, type } = result;

      if (type === "state") {
        const newStates = Array.from(states ?? []);
        const [reorderedState] = newStates.splice(source.index, 1);
        newStates.splice(destination.index, 0, reorderedState);
        const prevSequenceNumber = newStates[destination.index - 1]?.sequence;
        const nextSequenceNumber = newStates[destination.index + 1]?.sequence;

        const sequenceNumber =
          prevSequenceNumber && nextSequenceNumber
            ? (prevSequenceNumber + nextSequenceNumber) / 2
            : nextSequenceNumber
            ? nextSequenceNumber - 15000 / 2
            : prevSequenceNumber
            ? prevSequenceNumber + 15000 / 2
            : 15000;

        newStates[destination.index].sequence = sequenceNumber;

        mutateState(newStates, false);

        stateService
          .patchState(
            workspaceSlug as string,
            projectId as string,
            newStates[destination.index].id,
            {
              sequence: sequenceNumber,
            }
          )
          .then((response) => {
            console.log(response);
          })
          .catch((err) => {
            console.error(err);
          });
      } else {
        const draggedItem = groupedByIssues[source.droppableId][source.index];
        if (source.droppableId !== destination.droppableId) {
          const sourceGroup = source.droppableId; // source group id
          const destinationGroup = destination.droppableId; // destination group id

          if (!sourceGroup || !destinationGroup) return;

          if (selectedGroup === "priority") {
            // update the removed item for mutation
            draggedItem.priority = destinationGroup;

            // patch request
            issuesService.patchIssue(workspaceSlug as string, projectId as string, draggedItem.id, {
              priority: destinationGroup,
            });
          } else if (selectedGroup === "state_detail.name") {
            const destinationState = states?.find((s) => s.name === destinationGroup);
            const destinationStateId = destinationState?.id;

            // update the removed item for mutation
            if (!destinationStateId || !destinationState) return;
            draggedItem.state = destinationStateId;
            draggedItem.state_detail = destinationState;

            mutate<IssueResponse>(
              PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string),
              (prevData) => {
                if (!prevData) return prevData;

                const updatedIssues = prevData.results.map((issue) => {
                  if (issue.id === draggedItem.id)
                    return {
                      ...draggedItem,
                      state_detail: destinationState,
                      state: destinationStateId,
                    };

                  return issue;
                });

                return {
                  ...prevData,
                  results: updatedIssues,
                };
              },
              false
            );

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
                        },
                      };
                    }
                    return issue;
                  });
                  return [...updatedIssues];
                },
                false
              );

            // patch request
            issuesService
              .patchIssue(workspaceSlug as string, projectId as string, draggedItem.id, {
                state: destinationStateId,
              })
              .then((res) => {
                mutate(CYCLE_ISSUES(cycleId as string));
                mutate(MODULE_ISSUES(moduleId as string));
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
      mutateState,
      groupedByIssues,
      projectId,
      selectedGroup,
      states,
    ]
  );

  if (issueView !== "kanban") return <></>;

  return (
    <>
      <DeleteIssueModal
        isOpen={isIssueDeletionOpen}
        handleClose={() => setIsIssueDeletionOpen(false)}
        data={issueDeletionData}
      />
      <CreateUpdateIssueModal
        isOpen={createIssueModal && preloadedData?.actionType === "createIssue"}
        handleClose={() => setCreateIssueModal(false)}
        prePopulateData={{
          ...preloadedData,
        }}
      />
      {groupedByIssues ? (
        <div className="h-[calc(100vh-157px)] lg:h-[calc(100vh-115px)] w-full">
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <div className="h-full w-full overflow-hidden">
              <StrictModeDroppable droppableId="state" type="state" direction="horizontal">
                {(provided) => (
                  <div
                    className="h-full w-full"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    <div className="flex h-full gap-x-4 overflow-x-auto overflow-y-hidden">
                      {Object.keys(groupedByIssues).map((singleGroup, index) => {
                        const stateId =
                          selectedGroup === "state_detail.name"
                            ? states?.find((s) => s.name === singleGroup)?.id ?? null
                            : null;

                        const bgColor =
                          selectedGroup === "state_detail.name"
                            ? states?.find((s) => s.name === singleGroup)?.color
                            : "#000000";

                        return (
                          <Draggable key={singleGroup} draggableId={singleGroup} index={index}>
                            {(provided, snapshot) => (
                              <CommonSingleBoard
                                type={type}
                                provided={provided}
                                snapshot={snapshot}
                                bgColor={bgColor}
                                groupTitle={singleGroup}
                                groupedByIssues={groupedByIssues}
                                selectedGroup={selectedGroup}
                                addIssueToState={() => {
                                  setCreateIssueModal(true);
                                  if (selectedGroup)
                                    setPreloadedData({
                                      state: stateId !== null ? stateId : undefined,
                                      [selectedGroup]: singleGroup,
                                      actionType: "createIssue",
                                    });
                                }}
                                handleDeleteIssue={handleDeleteIssue}
                                openIssuesListModal={type !== "issue" ? openIssuesListModal : null}
                                userAuth={userAuth}
                              />
                            )}
                          </Draggable>
                        );
                      })}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </StrictModeDroppable>
            </div>
          </DragDropContext>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center">Loading...</div>
      )}
    </>
  );
};
