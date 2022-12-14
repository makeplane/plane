import React, { useCallback } from "react";
// swr
import useSWR, { mutate } from "swr";
// services
import stateService from "lib/services/state.service";
// constants
import { STATE_LIST, CYCLE_ISSUES } from "constants/fetch-keys";
// components
import SingleBoard from "components/project/cycles/board-view/single-board";
// ui
import { Spinner } from "ui";
// types
import { CycleIssueResponse, IIssue, IProjectMember, NestedKeyOf, Properties } from "types";
import { useRouter } from "next/router";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import issuesService from "lib/services/issues.service";

type Props = {
  groupedByIssues: {
    [key: string]: IIssue[];
  };
  properties: Properties;
  selectedGroup: NestedKeyOf<IIssue> | null;
  members: IProjectMember[] | undefined;
  openCreateIssueModal: (issue?: IIssue, actionType?: "create" | "edit" | "delete") => void;
  openIssuesListModal: () => void;
  removeIssueFromCycle: (bridgeId: string) => void;
  partialUpdateIssue: (formData: Partial<IIssue>, issueId: string) => void;
  handleDeleteIssue: React.Dispatch<React.SetStateAction<string | undefined>>;
  setPreloadedData: React.Dispatch<
    React.SetStateAction<
      | (Partial<IIssue> & {
          actionType: "createIssue" | "edit" | "delete";
        })
      | undefined
    >
  >;
};

const CyclesBoardView: React.FC<Props> = (props) => {
  const {
    groupedByIssues,
    properties,
    selectedGroup,
    members,
    openCreateIssueModal,
    openIssuesListModal,
    removeIssueFromCycle,
    partialUpdateIssue,
    handleDeleteIssue,
    setPreloadedData,
  } = props;

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

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

          if (!cycleId) return;
          mutate<CycleIssueResponse[]>(
            CYCLE_ISSUES(cycleId as string),
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
    [workspaceSlug, groupedByIssues, projectId, selectedGroup, states, cycleId]
  );

  return (
    <>
      {groupedByIssues ? (
        <div className="h-full w-full">
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <div className="h-full w-full overflow-hidden">
              <div className="h-full w-full">
                <div className="flex h-full gap-x-4 overflow-x-auto overflow-y-hidden pb-3">
                  {Object.keys(groupedByIssues).map((singleGroup) => (
                    <SingleBoard
                      key={singleGroup}
                      selectedGroup={selectedGroup}
                      groupTitle={singleGroup}
                      createdBy={
                        selectedGroup === "created_by"
                          ? members?.find((m) => m.member.id === singleGroup)?.member.first_name ??
                            "loading..."
                          : null
                      }
                      groupedByIssues={groupedByIssues}
                      bgColor={
                        selectedGroup === "state_detail.name"
                          ? states?.find((s) => s.name === singleGroup)?.color
                          : "#000000"
                      }
                      properties={properties}
                      removeIssueFromCycle={removeIssueFromCycle}
                      openIssuesListModal={openIssuesListModal}
                      openCreateIssueModal={openCreateIssueModal}
                      partialUpdateIssue={partialUpdateIssue}
                      handleDeleteIssue={handleDeleteIssue}
                      setPreloadedData={setPreloadedData}
                      stateId={
                        selectedGroup === "state_detail.name"
                          ? states?.find((s) => s.name === singleGroup)?.id ?? null
                          : null
                      }
                    />
                  ))}
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

export default CyclesBoardView;
