import React, { useCallback, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-beautiful-dnd
import { DragDropContext, DropResult } from "react-beautiful-dnd";
// hook
import useIssuesProperties from "hooks/use-issue-properties";
import useIssueView from "hooks/use-issue-view";
// services
import stateServices from "services/state.service";
import issuesServices from "services/issues.service";
import projectService from "services/project.service";
// components
import SingleBoard from "components/project/issues/BoardView/single-board";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { CreateUpdateIssueModal } from "components/issues/modal";
import ConfirmIssueDeletion from "components/project/issues/confirm-issue-deletion";
// ui
import { Spinner } from "components/ui";
// types
import type { IState, IIssue, IssueResponse, UserAuth } from "types";
// fetch-keys
import { STATE_LIST, PROJECT_ISSUES_LIST, PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  issues: IIssue[];
  handleDeleteIssue: React.Dispatch<React.SetStateAction<string | undefined>>;
  userAuth: UserAuth;
};

const BoardView: React.FC<Props> = ({ issues, handleDeleteIssue, userAuth }) => {
  const [createIssueModal, setCreateIssueModal] = useState(false);
  const [isIssueDeletionOpen, setIsIssueDeletionOpen] = useState(false);
  const [issueDeletionData, setIssueDeletionData] = useState<IIssue | undefined>();
  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issueView, groupedByIssues, groupByProperty: selectedGroup } = useIssueView(issues);

  const { data: states, mutate: mutateState } = useSWR<IState[]>(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug
      ? () => stateServices.getStates(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null,
    {
      onErrorRetry(err, _, __, revalidate, revalidateOpts) {
        if (err?.status === 403) return;
        setTimeout(() => revalidate(revalidateOpts), 5000);
      },
    }
  );

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const handleOnDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const { source, destination, type } = result;

      if (destination.droppableId === "trashBox") {
        // setIssueDeletionData(draggedItem);
        setIsIssueDeletionOpen(true);
      } else {
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
          if (!workspaceSlug) return;
          stateServices
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
              issuesServices.patchIssue(
                workspaceSlug as string,
                projectId as string,
                draggedItem.id,
                {
                  priority: destinationGroup,
                }
              );
            } else if (selectedGroup === "state_detail.name") {
              const destinationState = states?.find((s) => s.name === destinationGroup);
              const destinationStateId = destinationState?.id;

              // update the removed item for mutation
              if (!destinationStateId || !destinationState) return;
              draggedItem.state = destinationStateId;
              draggedItem.state_detail = destinationState;

              // patch request
              issuesServices.patchIssue(
                workspaceSlug as string,
                projectId as string,
                draggedItem.id,
                {
                  state: destinationStateId,
                }
              );

              // mutate the issues
              if (!workspaceSlug || !projectId) return;
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
            }
          }
        }
      }
    },
    [workspaceSlug, mutateState, groupedByIssues, projectId, selectedGroup, states]
  );

  if (issueView !== "kanban") return <></>;

  return (
    <>
      <ConfirmIssueDeletion
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
        <div className="h-screen w-full">
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
                      {Object.keys(groupedByIssues).map((singleGroup, index) => (
                        <SingleBoard
                          key={singleGroup}
                          selectedGroup={selectedGroup}
                          groupTitle={singleGroup}
                          createdBy={
                            selectedGroup === "created_by"
                              ? members?.find((m) => m.member.id === singleGroup)?.member
                                  .first_name ?? "loading..."
                              : null
                          }
                          groupedByIssues={groupedByIssues}
                          index={index}
                          setIsIssueOpen={setCreateIssueModal}
                          properties={properties}
                          setPreloadedData={setPreloadedData}
                          stateId={
                            selectedGroup === "state_detail.name"
                              ? states?.find((s) => s.name === singleGroup)?.id ?? null
                              : null
                          }
                          bgColor={
                            selectedGroup === "state_detail.name"
                              ? states?.find((s) => s.name === singleGroup)?.color
                              : "#000000"
                          }
                          handleDeleteIssue={handleDeleteIssue}
                          userAuth={userAuth}
                        />
                      ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </StrictModeDroppable>
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

export default BoardView;
