import React, { useCallback } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-beautiful-dnd
import { DragDropContext, DropResult } from "react-beautiful-dnd";
// services
import stateService from "services/state.service";
import issuesService from "services/issues.service";
// hooks
import useIssueView from "hooks/use-issue-view";
// components
import { CommonSingleBoard } from "components/core/board-view/single-board";
// ui
import { Spinner } from "components/ui";
// types
import { IIssue, ModuleIssueResponse, UserAuth } from "types";
// constants
import { STATE_LIST, MODULE_ISSUES } from "constants/fetch-keys";

type Props = {
  issues: IIssue[];
  openCreateIssueModal: (issue?: IIssue, actionType?: "create" | "edit" | "delete") => void;
  openIssuesListModal: () => void;
  handleDeleteIssue: React.Dispatch<React.SetStateAction<string | undefined>>;
  setPreloadedData: React.Dispatch<
    React.SetStateAction<
      | (Partial<IIssue> & {
          actionType: "createIssue" | "edit" | "delete";
        })
      | null
    >
  >;
  userAuth: UserAuth;
};

export const ModulesBoardView: React.FC<Props> = ({
  issues,
  openCreateIssueModal,
  openIssuesListModal,
  handleDeleteIssue,
  setPreloadedData,
  userAuth,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const { issueView, groupedByIssues, groupByProperty: selectedGroup } = useIssueView(issues);

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );

  const handleOnDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const { source, destination } = result;

      if (source.droppableId !== destination.droppableId) {
        const sourceGroup = source.droppableId; // source group id
        const destinationGroup = destination.droppableId; // destination group id
        if (!sourceGroup || !destinationGroup) return;

        // removed/dragged item
        const removedItem = groupedByIssues[source.droppableId][source.index];

        if (selectedGroup === "priority") {
          // update the removed item for mutation
          removedItem.priority = destinationGroup;

          // patch request
          issuesService.patchIssue(workspaceSlug as string, projectId as string, removedItem.id, {
            priority: destinationGroup,
          });
        } else if (selectedGroup === "state_detail.name") {
          const destinationState = states?.find((s) => s.name === destinationGroup);
          const destinationStateId = destinationState?.id;

          // update the removed item for mutation
          if (!destinationStateId || !destinationState) return;
          removedItem.state = destinationStateId;
          removedItem.state_detail = destinationState;

          // patch request
          issuesService.patchIssue(workspaceSlug as string, projectId as string, removedItem.id, {
            state: destinationStateId,
          });

          if (!moduleId) return;
          mutate<ModuleIssueResponse[]>(
            MODULE_ISSUES(moduleId as string),
            (prevData) => {
              if (!prevData) return prevData;
              const updatedIssues = prevData.map((issue) => {
                if (issue.issue_detail.id === removedItem.id) {
                  return {
                    ...issue,
                    issue_detail: removedItem,
                  };
                }
                return issue;
              });
              return [...updatedIssues];
            },
            false
          );
        }

        // remove item from the source group
        groupedByIssues[source.droppableId].splice(source.index, 1);
        // add item to the destination group
        groupedByIssues[destination.droppableId].splice(destination.index, 0, removedItem);
      }
    },
    [workspaceSlug, groupedByIssues, projectId, selectedGroup, states, moduleId]
  );

  if (issueView !== "kanban") return <></>;

  return (
    <>
      {groupedByIssues ? (
        <div className="h-[calc(100vh-157px)] lg:h-[calc(100vh-115px)] w-full">
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <div className="h-full w-full overflow-hidden">
              <div className="h-full w-full">
                <div className="flex h-full gap-x-4 overflow-x-auto overflow-y-hidden">
                  {Object.keys(groupedByIssues).map((singleGroup) => {
                    const stateId =
                      selectedGroup === "state_detail.name"
                        ? states?.find((s) => s.name === singleGroup)?.id ?? null
                        : null;

                    return (
                      <CommonSingleBoard
                        key={singleGroup}
                        bgColor={
                          selectedGroup === "state_detail.name"
                            ? states?.find((s) => s.name === singleGroup)?.color
                            : "#000000"
                        }
                        groupTitle={singleGroup}
                        groupedByIssues={groupedByIssues}
                        selectedGroup={selectedGroup}
                        addIssueToState={() => {
                          openCreateIssueModal();
                          if (selectedGroup !== null) {
                            setPreloadedData({
                              state: stateId !== null ? stateId : undefined,
                              [selectedGroup]: singleGroup,
                              actionType: "createIssue",
                            });
                          }
                        }}
                        // openIssuesListModal={openIssuesListModal}
                        handleDeleteIssue={handleDeleteIssue}
                        userAuth={userAuth}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </DragDropContext>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      )}
    </>
  );
};
